import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { createChatAgent } from "@/lib/ai/agent";
import { parseAiEnv, providerSchema } from "@/lib/ai/env";
import { resolveModel } from "@/lib/ai/registry";

// messages の中身(UIMessage の構造)は createAgentUIStreamResponse がツール定義と
// 照合して検証するため、ここではリクエストの外形のみを検証する
const chatRequestSchema = z.object({
	messages: z.array(z.unknown()).min(1),
	provider: providerSchema.optional(),
});

export async function POST(request: Request): Promise<Response> {
	const body: unknown = await request.json().catch(() => null);
	const parsed = chatRequestSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
	}

	const env = parseAiEnv();
	const provider = parsed.data.provider ?? env.AI_PROVIDER;
	const agent = createChatAgent(resolveModel(provider, env));

	return createAgentUIStreamResponse({
		agent,
		uiMessages: parsed.data.messages,
		abortSignal: request.signal,
	});
}
