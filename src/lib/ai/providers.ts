// クライアント(プロバイダ選択 UI)とサーバー(Route Handler)で共有する定義。
// API キー等の秘密情報は置かないこと(クライアントバンドルに含まれる)。
// クライアントバンドル肥大を避けるため、zod スキーマはサーバー側(env.ts / route.ts)で定義する。
export const PROVIDERS = ["anthropic", "openai", "ollama"] as const;

export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
	anthropic: "Anthropic",
	openai: "OpenAI",
	ollama: "Ollama (local)",
};

export function isProvider(value: unknown): value is Provider {
	return PROVIDERS.includes(value as Provider);
}
