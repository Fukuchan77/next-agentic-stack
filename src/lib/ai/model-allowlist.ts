import type { Provider } from "./providers";

// モデル ID を直書きしてよい唯一の場所。ハブ(vaz-agentic-ai-next)の
// `packages/config/src/model-allowlist.ts` と同じ値・同じ並びに揃える(先頭が既定値)。
// 環境変数(ANTHROPIC_MODEL 等)で別のモデルを指定することは妨げない。ここは既定値と
// 動作確認済みモデルの一覧であり、実行時の拒否リストではない(ハブも同じ扱い)。
//
// `satisfies Record<Provider, …>` により、PROVIDERS にプロバイダを足すと、ここに
// エントリを足すまで型検査が通らない。
export const MODEL_ALLOWLIST = {
	anthropic: ["claude-opus-5-5"],
	openai: ["gpt-6-sol"],
	// Granite 4.2 latest をエージェント/ツール用途の既定とし、小型版と Gemma は明示指定で使う
	ollama: ["granite4.2:latest", "granite4.2:3b", "gemma4:e2b", "gemma4:e4b"],
} as const satisfies Record<Provider, readonly [string, ...string[]]>;

export const DEFAULT_MODEL_ID = {
	anthropic: MODEL_ALLOWLIST.anthropic[0],
	openai: MODEL_ALLOWLIST.openai[0],
	ollama: MODEL_ALLOWLIST.ollama[0],
} as const satisfies Record<Provider, string>;
