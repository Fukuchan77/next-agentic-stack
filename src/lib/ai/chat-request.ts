import { z } from "zod";
import { providerSchema } from "./env";
import {
	MAX_MESSAGES,
	MAX_PARTS_PER_MESSAGE,
	MAX_REQUEST_BYTES,
	MAX_USER_TEXT_CHARS,
} from "./limits";

// パートの詳細(ツールパートの入出力など)は createAgentUIStreamResponse がツール定義と
// 照合して検証するため、ここでは外形・件数・サイズの上限を検証する
const partSchema = z.looseObject({ type: z.string().min(1) });

const textPartSchema = z.looseObject({
	type: z.literal("text"),
	text: z.string().max(MAX_USER_TEXT_CHARS),
});

const messageSchema = z
	.looseObject({
		id: z.string().min(1).max(200),
		// system ロールはクライアントから受け付けない(指示の注入を防ぐ。system 指示はサーバー側の agent が持つ)
		role: z.enum(["user", "assistant"]),
		parts: z.array(partSchema).min(1).max(MAX_PARTS_PER_MESSAGE),
	})
	.superRefine((message, ctx) => {
		if (message.role !== "user") return;
		message.parts.forEach((part, index) => {
			if (part.type !== "text") return;
			const result = textPartSchema.safeParse(part);
			if (!result.success) {
				ctx.addIssue({
					code: "custom",
					path: ["parts", index, "text"],
					message: `Text must be a string of at most ${MAX_USER_TEXT_CHARS} characters`,
				});
			}
		});
	});

// useChat(DefaultChatTransport)が送るフィールドのみを許可し、未知のフィールドは拒否する
export const chatRequestSchema = z.strictObject({
	id: z.string().max(200).optional(),
	messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
	trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
	messageId: z.string().max(200).optional(),
	provider: providerSchema.optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ParseChatRequestResult =
	| { ok: true; data: ChatRequest }
	| { ok: false; status: 400 | 413; error: string };

/** リクエストボディをサイズ上限付きで読み取り、スキーマで検証する */
export async function parseChatRequest(request: Request): Promise<ParseChatRequestResult> {
	const declared = Number(request.headers.get("content-length"));
	if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
		return tooLarge();
	}

	// Content-Length は省略・偽装できるため、実際に読み取ったバイト数でも検査する
	const bytes = await readBodyWithLimit(request, MAX_REQUEST_BYTES).catch(() => null);
	if (bytes === null) return { ok: false, status: 400, error: "Unreadable request body" };
	if (bytes === "too-large") return tooLarge();

	let body: unknown;
	try {
		body = JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return { ok: false, status: 400, error: "Request body must be valid JSON" };
	}

	const parsed = chatRequestSchema.safeParse(body);
	if (!parsed.success) {
		return { ok: false, status: 400, error: z.prettifyError(parsed.error) };
	}
	return { ok: true, data: parsed.data };
}

/** 上限を超えた時点で読み取りを打ち切る(巨大なボディを全量メモリに載せない) */
async function readBodyWithLimit(
	request: Request,
	limit: number,
): Promise<Uint8Array | "too-large"> {
	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > limit) {
			await reader.cancel();
			return "too-large";
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

function tooLarge(): ParseChatRequestResult {
	return {
		ok: false,
		status: 413,
		error: `Request body must be at most ${MAX_REQUEST_BYTES} bytes`,
	};
}
