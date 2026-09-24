import { createAgentUIStreamResponse } from "ai";
import { type Clock, systemClock } from "@/lib/clock";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { createChatAgent } from "./agent";
import { parseChatRequest } from "./chat-request";
import { parseAiEnv } from "./env";
import { resolveModel } from "./registry";

export interface ChatHandlerOptions {
	now?: Clock;
	/** 省略時は環境変数(CHAT_RATE_LIMIT_*)から生成する */
	rateLimiter?: RateLimiter;
}

/**
 * /api/chat の POST ハンドラ。route.ts は App Router の規約上 HTTP メソッド以外を
 * export できないため、依存(時刻・レート制限)を注入できる形でここに置く。
 */
export function createChatHandler({ now = systemClock, rateLimiter }: ChatHandlerOptions = {}) {
	let limiter = rateLimiter;

	return async function POST(request: Request): Promise<Response> {
		const env = parseAiEnv();
		limiter ??= createRateLimiter({
			limit: env.CHAT_RATE_LIMIT_MAX,
			windowMs: env.CHAT_RATE_LIMIT_WINDOW_SECONDS * 1000,
			now,
		});

		// ボディを読む前に弾き、LLM 呼び出し(= API 料金)の手前で止める
		const rate = limiter.check(clientKey(request));
		const rateHeaders = {
			"RateLimit-Limit": String(rate.limit),
			"RateLimit-Remaining": String(rate.remaining),
			"RateLimit-Reset": String(rate.resetSeconds),
		};
		if (!rate.allowed) {
			return Response.json(
				{ error: "Too many requests" },
				{ status: 429, headers: { ...rateHeaders, "Retry-After": String(rate.resetSeconds) } },
			);
		}

		const parsed = await parseChatRequest(request);
		if (!parsed.ok) {
			return Response.json({ error: parsed.error }, { status: parsed.status });
		}

		const provider = parsed.data.provider ?? env.AI_PROVIDER;
		const agent = createChatAgent(resolveModel(provider, env), { now });

		return createAgentUIStreamResponse({
			agent,
			uiMessages: parsed.data.messages,
			abortSignal: request.signal,
			headers: rateHeaders,
		});
	};
}
