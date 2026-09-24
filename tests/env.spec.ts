import { parseAiEnv } from "@/lib/ai/env";

test("parseAiEnv applies defaults when variables are unset", () => {
	const env = parseAiEnv({});

	expect(env.AI_PROVIDER).toBe("anthropic");
	expect(env.OLLAMA_BASE_URL).toBe("http://localhost:11434/v1");
	expect(env.ANTHROPIC_MODEL).not.toBe("");
	expect(env.OPENAI_MODEL).not.toBe("");
	expect(env.OLLAMA_MODEL).not.toBe("");
});

test("parseAiEnv accepts explicit values", () => {
	const env = parseAiEnv({ AI_PROVIDER: "ollama", OLLAMA_MODEL: "llama3.2" });

	expect(env.AI_PROVIDER).toBe("ollama");
	expect(env.OLLAMA_MODEL).toBe("llama3.2");
});

test("parseAiEnv rejects an unknown provider", () => {
	expect(() => parseAiEnv({ AI_PROVIDER: "unknown" })).toThrow(/AI_PROVIDER/);
});

test("parseAiEnv rejects an invalid Ollama URL", () => {
	expect(() => parseAiEnv({ OLLAMA_BASE_URL: "not a url" })).toThrow(/OLLAMA_BASE_URL/);
});
