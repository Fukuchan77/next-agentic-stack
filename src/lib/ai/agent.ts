import { type InferAgentUIMessage, isStepCount, type LanguageModel, ToolLoopAgent } from "ai";
import { type Clock, systemClock } from "@/lib/clock";
import { createGetCurrentTimeTool } from "./tools";

export interface ChatAgentOptions {
	/** ツールが参照する現在時刻。テストでは固定時刻を返す Clock を渡す */
	now?: Clock;
}

export function createChatAgent(
	model: LanguageModel,
	{ now = systemClock }: ChatAgentOptions = {},
) {
	return new ToolLoopAgent({
		model,
		instructions:
			"You are a concise, helpful assistant. Use the available tools when they help answer the user.",
		tools: {
			getCurrentTime: createGetCurrentTimeTool(now),
		},
		// ツール呼び出しループの暴走を防ぐ上限
		stopWhen: isStepCount(5),
	});
}

export type ChatAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createChatAgent>>;
