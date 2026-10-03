import { parseAiEnv } from "@/lib/ai/env";
import { DEFAULT_MODEL_ID, MODEL_ALLOWLIST } from "@/lib/ai/model-allowlist";
import { PROVIDERS } from "@/lib/ai/providers";

test("env defaults come from DEFAULT_MODEL_ID", () => {
	const env = parseAiEnv({});

	expect(env.ANTHROPIC_MODEL).toBe(DEFAULT_MODEL_ID.anthropic);
	expect(env.OPENAI_MODEL).toBe(DEFAULT_MODEL_ID.openai);
	expect(env.OLLAMA_MODEL).toBe(DEFAULT_MODEL_ID.ollama);
});

test("every provider has an allowlist whose first entry is the default", () => {
	for (const provider of PROVIDERS) {
		expect(MODEL_ALLOWLIST[provider][0]).toBe(DEFAULT_MODEL_ID[provider]);
	}
});

test("defaults match the hub's model allowlist", () => {
	// ハブの packages/config/src/model-allowlist.ts と同じ値。ハブ側が変わったらここも更新する
	expect(DEFAULT_MODEL_ID).toEqual({
		anthropic: "claude-opus-5-5",
		openai: "gpt-6-sol",
		ollama: "granite4.2:latest",
	});
});
