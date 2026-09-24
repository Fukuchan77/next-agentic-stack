import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

const usage = {
	inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
	outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const finish = {
	type: "finish",
	finishReason: { unified: "stop", raw: undefined },
	logprobs: undefined,
	usage,
} as const;

// テキストのみをストリーミングで返すモックモデル
export function createStreamingTextModel(text: string) {
	return new MockLanguageModelV4({
		doStream: async () => ({
			stream: simulateReadableStream({
				chunks: [
					{ type: "text-start", id: "text-1" },
					{ type: "text-delta", id: "text-1", delta: text },
					{ type: "text-end", id: "text-1" },
					finish,
				],
			}),
		}),
	});
}

// 1 ステップ目でツールを呼び、2 ステップ目でテキストを返すモックモデル
export function createToolCallingModel(toolName: string, input: unknown, finalText: string) {
	let step = 0;
	return new MockLanguageModelV4({
		doGenerate: async () => {
			step += 1;
			if (step === 1) {
				return {
					content: [
						{
							type: "tool-call",
							toolCallId: "call-1",
							toolName,
							input: JSON.stringify(input),
						},
					],
					finishReason: { unified: "tool-calls", raw: undefined },
					usage,
					warnings: [],
				};
			}
			return {
				content: [{ type: "text", text: finalText }],
				finishReason: { unified: "stop", raw: undefined },
				usage,
				warnings: [],
			};
		},
	});
}
