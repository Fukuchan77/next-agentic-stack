import { type InferAgentUIMessage, isStepCount, type LanguageModel, ToolLoopAgent } from "ai";
import { getCurrentTimeTool } from "./tools";

export function createChatAgent(model: LanguageModel) {
	return new ToolLoopAgent({
		model,
		instructions:
			"You are a concise, helpful assistant. Use the available tools when they help answer the user.",
		tools: {
			getCurrentTime: getCurrentTimeTool,
		},
		// ツール呼び出しループの暴走を防ぐ上限
		stopWhen: isStepCount(5),
	});
}

export type ChatAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createChatAgent>>;
