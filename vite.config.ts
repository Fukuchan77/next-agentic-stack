/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((configEnv) => {
	const isDevelopment = configEnv.mode === "development";

	return {
		plugins: [react()],
		css: {
			modules: {
				generateScopedName: isDevelopment ? "[name]__[local]__[hash:base64:5]" : "[hash:base64:5]",
			},
			preprocessorOptions: {
				scss: {
					// Carbon Design System v1.x が Sass モダン API 非対応のため一時的に抑制
					// Carbon アップデート後に解消されたら順次削除する
					silenceDeprecations: ["color-functions", "global-builtin", "import"],
				},
			},
		},
		optimizeDeps: {
			include: ["@carbon/react"],
		},
		test: {
			environment: "jsdom",
			setupFiles: ["./tests/setupTests.ts"],
			globals: true,
			exclude: ["tests/e2e/**", "node_modules/**"],
			coverage: {
				provider: "v8",
				thresholds: { lines: 80, functions: 80 },
			},
		},
	};
});
