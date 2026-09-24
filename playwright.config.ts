import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
	],
	webServer: {
		// CI では本番ビルド(pnpm build 済み)を next start で配信する。
		// pnpm 12 の `pnpm start` / `pnpm exec` 経由だと終了シグナルが next-server に届かず
		// テスト完了後にハングするため、next を直接起動する(pnpm test:e2e が PATH を通す)
		command: process.env.CI ? "next start" : "next dev",
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
	},
});
