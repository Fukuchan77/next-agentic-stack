// @vitest-environment node

import { createPrereleaseReport } from "../../scripts/lib/prerelease-report";

type RegistryMetadata = {
	"dist-tags": { latest: string };
	time: Record<string, string>;
	versions: Record<
		string,
		{
			dependencies?: Record<string, string>;
			peerDependencies?: Record<string, string>;
		}
	>;
};

type FakeResponse = {
	json: () => Promise<unknown>;
	ok: boolean;
	status: number;
};

const NOW = new Date("2026-10-04T12:00:00.000Z");
const OLD = "2026-10-03T10:00:00.000Z";
const RECENT = "2026-10-04T11:00:00.000Z";

const dependencies = {
	"@playwright/test": "1.64.0-alpha-2026-10-02",
	next: "16.4.0-canary.57",
	typescript: "7.1.0-dev.20261001.1",
};

function metadata(
	latest: string,
	time: Record<string, string>,
	versions: RegistryMetadata["versions"] = {},
): RegistryMetadata {
	return { "dist-tags": { latest }, time, versions };
}

function okResponse(value: unknown): FakeResponse {
	return {
		json: async () => value,
		ok: true,
		status: 200,
	};
}

function registry(overrides: Record<string, RegistryMetadata> = {}) {
	const values: Record<string, RegistryMetadata> = {
		"@playwright/test": metadata("1.63.0", {
			"1.64.0-alpha-2026-10-02": OLD,
			"1.64.0-alpha-2026-10-03": OLD,
		}),
		next: metadata("16.4.0", {
			"16.4.0": OLD,
			"16.4.0-canary.57": OLD,
			"16.4.0-canary.58": OLD,
			"16.4.0-canary.59": RECENT,
		}),
		"openapi-typescript": metadata(
			"7.14.0",
			{ "7.14.0": OLD },
			{
				"7.14.0": {
					dependencies: { typescript: ">=5.7.0" },
					peerDependencies: { typescript: "^5.0.0" },
				},
			},
		),
		typescript: metadata("7.0.1", {
			"7.0.1": OLD,
			"7.1.0-dev.20261001.1": OLD,
			"7.1.0-dev.20261002.1": OLD,
			"7.1.0-dev.20261003.1": RECENT,
		}),
		...overrides,
	};

	return vi.fn(async (name: string) => okResponse(values[name]));
}

function createReport(fetchPackage = registry()) {
	return createPrereleaseReport({
		dependencies,
		fetchPackage,
		minimumReleaseAgeMinutes: 1440,
		now: NOW,
	});
}

describe("prerelease update reporter", () => {
	test("24h cutoff と channel を適用し、pin・stable・監視行を返す", async () => {
		const report = await createReport();

		expect(report.exitCode).toBe(0);
		expect(report.pinRows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					current: "16.4.0-canary.57",
					latest: "16.4.0-canary.58",
					name: "next",
					stable: "16.4.0",
				}),
				expect.objectContaining({
					latest: "7.1.0-dev.20261002.1",
					name: "typescript",
					stable: "-",
				}),
			]),
		);
		expect(report.pinRows).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({ latest: "16.4.0-canary.59" }),
				expect.objectContaining({ latest: "7.1.0-dev.20261003.1" }),
			]),
		);
		expect(report.watchRows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					dependencyRange: ">=5.7.0",
					latest: "7.14.0",
					name: "openapi-typescript",
					peerRange: "^5.0.0",
					publishedAt: OLD,
				}),
				expect.objectContaining({
					latest: "7.0.1",
					name: "typescript stable",
					publishedAt: OLD,
				}),
			]),
		);
	});

	test("stable 検知時は隔離評価と記録を案内し caret への切替を指示しない", async () => {
		const report = await createReport();
		const guidance = report.notices.join(" ");

		expect(guidance).toContain("24時間");
		expect(guidance).toContain("隔離");
		expect(guidance).toContain("beta-lane");
		expect(guidance).toContain("mise run");
		expect(guidance).not.toMatch(/caret|\^/i);
	});

	test.each([
		{
			failure: async (): Promise<FakeResponse> => ({
				json: async () => ({}),
				ok: false,
				status: 503,
			}),
			message: "HTTP 503",
			name: "HTTP 非 2xx",
		},
		{
			failure: async (): Promise<FakeResponse> => {
				throw new Error("network unavailable");
			},
			message: "network unavailable",
			name: "取得例外",
		},
		{
			failure: async (): Promise<FakeResponse> => ({
				json: async () => {
					throw new SyntaxError("Unexpected token");
				},
				ok: true,
				status: 200,
			}),
			message: "Unexpected token",
			name: "不正 JSON",
		},
	])("$name でも残りを処理し non-zero にする", async ({ failure, message }) => {
		const fallback = registry();
		const fetchPackage = vi.fn(async (name: string) => {
			if (name === "next") return failure();
			return fallback(name);
		});

		const report = await createReport(fetchPackage);

		expect(report.exitCode).toBe(1);
		expect(report.errorRows).toEqual([
			expect.objectContaining({ message: expect.stringContaining(message), name: "next" }),
		]);
		expect(report.pinRows).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: "typescript" })]),
		);
		expect(report.watchRows).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: "openapi-typescript" })]),
		);
		expect(fetchPackage).toHaveBeenCalledWith("@playwright/test");
		expect(fetchPackage).toHaveBeenCalledWith("openapi-typescript");
		expect(fetchPackage).toHaveBeenCalledWith("typescript");
	});
});
