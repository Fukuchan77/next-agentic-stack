import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setupTests.ts"],
		globals: true,
		include: ["tests/**/*.spec.{ts,tsx}"],
		exclude: ["tests/e2e/**", "node_modules/**"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}"],
			// Server Component のページ/レイアウトは E2E(Playwright)で検証する
			exclude: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
			thresholds: { lines: 80, functions: 80 },
		},
	},
});
