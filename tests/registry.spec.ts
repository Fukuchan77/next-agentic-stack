import { parseAiEnv } from "@/lib/ai/env";
import { PROVIDERS } from "@/lib/ai/providers";
import { modelIdFor, resolveModel } from "@/lib/ai/registry";

const env = parseAiEnv({
	ANTHROPIC_MODEL: "claude-test",
	OPENAI_MODEL: "gpt-test",
	OLLAMA_MODEL: "ollama-test",
});

test("modelIdFor maps each provider to its configured model", () => {
	expect(modelIdFor("anthropic", env)).toBe("claude-test");
	expect(modelIdFor("openai", env)).toBe("gpt-test");
	expect(modelIdFor("ollama", env)).toBe("ollama-test");
});

test.each(PROVIDERS)("resolveModel returns a language model for %s", (provider) => {
	const model = resolveModel(provider, env);

	expect(typeof model).toBe("object");
	expect(model).toHaveProperty("modelId", modelIdFor(provider, env));
});
