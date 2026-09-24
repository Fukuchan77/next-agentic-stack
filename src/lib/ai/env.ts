import { z } from "zod";
import { PROVIDERS } from "./providers";

// サーバー専用。API キー(ANTHROPIC_API_KEY / OPENAI_API_KEY)は各プロバイダ SDK が
// process.env から直接読むため、ここではモデル選択に関わる値のみ検証する。
export const providerSchema = z.enum(PROVIDERS);

const aiEnvSchema = z.object({
	AI_PROVIDER: providerSchema.default("anthropic"),
	ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
	OPENAI_MODEL: z.string().min(1).default("gpt-5.5"),
	OLLAMA_MODEL: z.string().min(1).default("qwen3"),
	// Ollama の OpenAI 互換エンドポイント
	OLLAMA_BASE_URL: z.url().default("http://localhost:11434/v1"),
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

export function parseAiEnv(env: Record<string, string | undefined> = process.env): AiEnv {
	const result = aiEnvSchema.safeParse(env);
	if (!result.success) {
		throw new Error(`Invalid AI environment variables:\n${z.prettifyError(result.error)}`);
	}
	return result.data;
}
