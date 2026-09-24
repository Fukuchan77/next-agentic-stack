import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createProviderRegistry, type LanguageModel } from "ai";
import type { AiEnv } from "./env";
import type { Provider } from "./providers";

export function createRegistry(env: AiEnv) {
	return createProviderRegistry({
		anthropic: createAnthropic(),
		openai: createOpenAI(),
		// Ollama は公式の OpenAI 互換 API を公開しているため、コミュニティ製プロバイダではなく
		// 公式パッケージ @ai-sdk/openai-compatible 経由で接続する(API キー不要)
		ollama: createOpenAICompatible({ name: "ollama", baseURL: env.OLLAMA_BASE_URL }),
	});
}

export function modelIdFor(provider: Provider, env: AiEnv): string {
	switch (provider) {
		case "anthropic":
			return env.ANTHROPIC_MODEL;
		case "openai":
			return env.OPENAI_MODEL;
		case "ollama":
			return env.OLLAMA_MODEL;
	}
}

export function resolveModel(provider: Provider, env: AiEnv): LanguageModel {
	return createRegistry(env).languageModel(`${provider}:${modelIdFor(provider, env)}`);
}
