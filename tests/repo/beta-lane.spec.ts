// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const betaLaneDir = join(projectRoot, "docs/beta-lane");
const retrospectiveException = "2026-10-03-shadcn-tailwind.md";
const recordFilePattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;
const requiredHeadings = ["結論", "検証した版", "通したゲート", "再現手順"] as const;
const triggerRows = [
	"`openapi-typescript` の TS 7 対応 release note",
	"ハブへの agent-ui source の着地",
	"Node 26 Active LTS",
] as const;
const prereleasePackages = ["typescript", "next", "@playwright/test"] as const;
const agentUiRequiredTexts = [
	"hub source の無改変コピー",
	"fixture-only unit tests",
	"承認待ち",
	"承認済み",
	"却下",
	"ツール結果",
	"ストリーミング中",
	"Gate matrix",
	"approval flow",
	"API",
	"persistence",
	"採否はハブ側",
] as const;
const templateHeaderLines = [
	"# <検証トピック>",
	"- 対象ハブコミット: `<ハブ main の 7〜40 桁の commit hash>`",
	"- 検証したコミット: `<本リポジトリの 7〜40 桁の commit hash>`",
	"- 対象の据え置き: <`docs/dependency-policy.md §8.1 <行名・障害>` | `ADR-<番号> <具体的な採用障害>` | `spec <番号> <具体的な採用障害>`>",
	"- 判定: <解消 | 部分解消 | 未解消>",
	"- 未解決事項: <未解決事項の要約。ない場合は「なし」>",
] as const;
const eventLaneRequirements = [
	["TS 7-only codegen", ["byte comparison", "TS 6 step"]],
	["TS 7 stable minor", ["前回記録の stable minor との差分", "`next typegen`", "`next build`"]],
	["Node 26", ["hub-equivalent 条件", "Node 以外の pin", "変更点の全一覧"]],
	["Stable transition", ["prerelease baseline", "差分がなかった場合も「差分なし」"]],
] as const;

type PrereleasePackage = (typeof prereleasePackages)[number];
type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};
type PrereleasePins = Record<PrereleasePackage, string>;

function linesOutsideFences(markdown: string): string[] {
	let inFence = false;
	const lines: string[] = [];

	for (const line of markdown.split(/\r?\n/)) {
		if (/^\s*```/.test(line)) {
			inFence = !inFence;
			continue;
		}
		if (!inFence) lines.push(line);
	}

	return lines;
}

function sectionLines(lines: string[], heading: string): string[] {
	const start = lines.indexOf(`## ${heading}`);
	if (start === -1) return [];
	const nextHeading = lines.findIndex((line, index) => index > start && /^## [^#]/.test(line));
	return lines.slice(start + 1, nextHeading === -1 ? undefined : nextHeading);
}

function isConcreteHold(value: string | undefined): boolean {
	const hold = value?.trim().replace(/[。．.]+$/, "");
	if (!hold || hold === "該当なし" || /該当なし/.test(hold)) return false;
	return (
		/docs\/dependency-policy\.md\s+§8\.1\s+\S.{2,}/.test(hold) ||
		/\bADR-\d+\b\s+.+\S/i.test(hold) ||
		/\bspec\s+`?\d+`?\s+.+\S/i.test(hold)
	);
}

function validateRecord(fileName: string, markdown: string): string[] {
	const errors: string[] = [];
	const lines = linesOutsideFences(markdown);
	const h1Indexes = lines.flatMap((line, index) => (/^# [^#]/.test(line) ? [index] : []));

	if (h1Indexes.length !== 1) {
		errors.push(`${fileName}: H1 は 1 件必要です`);
		return errors;
	}

	const metadata = lines.slice(h1Indexes[0] + 1, h1Indexes[0] + 6);
	const isRetrospectiveException = fileName === retrospectiveException;
	const metadataPatterns = [
		isRetrospectiveException
			? /^- 対象ハブコミット: 不明（遡及補正）$/
			: /^- 対象ハブコミット: `[0-9a-f]{7,40}`$/,
		isRetrospectiveException
			? /^- 検証したコミット: `479bd2a`$/
			: /^- 検証したコミット: `[0-9a-f]{7,40}`$/,
		/^- 対象の据え置き: .+$/,
		/^- 判定: (解消|部分解消|未解消)$/,
		/^- 未解決事項: .+$/,
	];

	for (const [index, pattern] of metadataPatterns.entries()) {
		if (!pattern.test(metadata[index] ?? "")) {
			errors.push(`${fileName}: 固定メタデータ ${index + 1} 行目が不正です`);
		}
	}

	const hold = metadata[2]?.replace(/^- 対象の据え置き: /, "");
	if (!isConcreteHold(hold)) {
		errors.push(
			`${fileName}: 対象の据え置きは §8.1、ADR、spec の具体的な障害を参照する必要があります`,
		);
	}

	const headings = new Set(
		lines.flatMap((line) => {
			const match = /^## ([^#].*)$/.exec(line);
			return match ? [match[1]] : [];
		}),
	);
	for (const heading of requiredHeadings) {
		if (!headings.has(heading)) errors.push(`${fileName}: 「${heading}」見出しがありません`);
	}
	if (!headings.has("ハブへ持ち込むときの注意") && !headings.has("ハブへ持ち込むときの手順案")) {
		errors.push(`${fileName}: ハブ持ち込み時の見出しがありません`);
	}

	const gateRows = parseTableRows(sectionLines(lines, "通したゲート").join("\n"));
	const gateHeaderIndex = gateRows.findIndex(
		(row) =>
			row.length === 2 &&
			/^(?:command|コマンド)$/i.test(row[0]) &&
			/^(?:result|結果)$/i.test(row[1]),
	);
	const hasGatePair = gateRows
		.slice(gateHeaderIndex + 1)
		.some((row) => row.length === 2 && row.every((cell) => cell !== ""));
	if (gateHeaderIndex === -1 || !hasGatePair) {
		errors.push(`${fileName}: 通したゲートに command/result pair がありません`);
	}

	return errors;
}

function getPrereleasePins(packageJson: PackageJson): PrereleasePins {
	return Object.fromEntries(
		prereleasePackages.map((packageName) => {
			const version =
				packageJson.dependencies?.[packageName] ?? packageJson.devDependencies?.[packageName];
			if (!version) throw new Error(`${packageName} の version がありません`);
			return [packageName, version];
		}),
	) as PrereleasePins;
}

function prereleaseChannel(packageName: PrereleasePackage, version: string): string | undefined {
	if (packageName === "typescript" && /^\d+\.\d+\.\d+-dev\./.test(version)) return "nightly";
	if (packageName === "next" && /^\d+\.\d+\.\d+-canary\./.test(version)) return "canary";
	if (packageName === "@playwright/test" && /^\d+\.\d+\.\d+-alpha-/.test(version)) return "alpha";
	return undefined;
}

function validateExactPins(pins: PrereleasePins): string[] {
	const expectedChannels: Record<PrereleasePackage, string> = {
		typescript: "nightly",
		next: "canary",
		"@playwright/test": "alpha",
	};
	return prereleasePackages.flatMap((packageName) =>
		exactVersionPattern.test(pins[packageName]) && prereleaseChannel(packageName, pins[packageName])
			? []
			: [
					`${packageName} は ${expectedChannels[packageName]} の exact prerelease pin ではありません`,
				],
	);
}

function majorMinor(version: string): string {
	const match = /^(\d+\.\d+)\./.exec(version);
	if (!match) throw new Error(`version を解析できません: ${version}`);
	return match[1];
}

function validateReadmeVersions(readme: string, pins: PrereleasePins): string[] {
	const errors: string[] = [];
	const expectations = [
		{
			packageName: "typescript" as const,
			row: /\| 言語 \|.*\| ([^|]+) \|/,
		},
		{
			packageName: "next" as const,
			row: /\| フレームワーク \|.*\| ([^|]+) \|/,
		},
		{
			packageName: "@playwright/test" as const,
			row: /\| E2E テスト \|.*\| ([^|]+) \|/,
		},
	];

	for (const expectation of expectations) {
		const displayed = expectation.row.exec(readme)?.[1]?.trim();
		const channel = prereleaseChannel(expectation.packageName, pins[expectation.packageName]);
		if (!channel) {
			errors.push(`${expectation.packageName} の prerelease channel を pin から導出できません`);
			continue;
		}
		const expected = `${majorMinor(pins[expectation.packageName])}(${channel})`;
		if (displayed !== expected) {
			errors.push(`${expectation.packageName} の技術スタック表は ${expected} である必要があります`);
		}
	}

	const warning =
		/TypeScript ([0-9]+\.[0-9]+) \/ Next\.js ([0-9]+\.[0-9]+) \/ Playwright ([0-9]+\.[0-9]+)/.exec(
			readme,
		);
	const expectedWarning = [
		majorMinor(pins.typescript),
		majorMinor(pins.next),
		majorMinor(pins["@playwright/test"]),
	];
	if (!warning || warning.slice(1).some((version, index) => version !== expectedWarning[index])) {
		errors.push("WARNING 節の prerelease major.minor が package.json と一致しません");
	}

	return errors;
}

function parseTableRows(markdown: string): string[][] {
	return linesOutsideFences(markdown).flatMap((line) => {
		if (!/^\|.*\|$/.test(line) || /^\|\s*:?-+/.test(line)) return [];
		return [
			line
				.slice(1, -1)
				.split("|")
				.map((cell) => cell.trim()),
		];
	});
}

function validateTemplateHeader(markdown: string): string[] {
	const lines = markdown.split(/\r?\n/);
	return templateHeaderLines.flatMap((expected, index) =>
		lines[index] === expected ? [] : [`template header ${index + 1} 行目が不正です`],
	);
}

function validateAgentUiLane(markdown: string): string[] {
	const row = parseTableRows(markdown).find((candidate) => candidate[0] === "Agent UI");
	if (row?.length !== 3) return ["Agent UI row が 3 列で定義されていません"];

	const contract = row.join(" ");

	return agentUiRequiredTexts.flatMap((requiredText) =>
		contract.includes(requiredText) ? [] : [`Agent UI row に「${requiredText}」がありません`],
	);
}

function validateLaneRow(
	markdown: string,
	lane: string,
	requiredTexts: readonly string[],
): string[] {
	const row = parseTableRows(markdown).find((candidate) => candidate[0] === lane);
	if (row?.length !== 3) return [`${lane} row が 3 列で定義されていません`];
	const contract = row.join(" ");
	return requiredTexts.flatMap((requiredText) =>
		contract.includes(requiredText) ? [] : [`${lane} row に「${requiredText}」がありません`],
	);
}

function validateIndex(index: string, recordFiles: string[]): string[] {
	const errors: string[] = [];
	const rows = parseTableRows(index);
	const recordRows = rows.filter((row) =>
		row.some((cell) => recordFilePattern.test(basename(cell.match(/\(([^)]+)\)/)?.[1] ?? ""))),
	);
	const linkedTargets = recordRows.flatMap((row) =>
		row.flatMap((cell) => {
			const target = cell.match(/\(([^)]+)\)/)?.[1];
			return target && recordFilePattern.test(basename(target)) ? [target] : [];
		}),
	);

	for (const row of recordRows) {
		if (row.length !== 5 || row.some((cell) => cell === "")) {
			errors.push("索引の各 record 行は空欄のない 5 列である必要があります");
			continue;
		}
		const isConcreteConsumer =
			/^(?:未取り込み|(?:hub|ハブ) spec `?\d{3}`?(?:\s+.+)?|(?:hub|ハブ) PR #\d+(?:\s+.+)?|https:\/\/github\.com\/Fukuchan77\/vaz-agentic-ai-next\/pull\/\d+)$/i.test(
				row[3],
			);
		if (!isConcreteConsumer) {
			errors.push("索引の取り込み先は hub spec/PR または 未取り込み である必要があります");
		}
	}
	for (const target of linkedTargets) {
		const fileName = basename(target);
		if (target !== fileName && target !== `./${fileName}`) {
			errors.push(`${target} は同じ directory の record link ではありません`);
		}
		if (!recordFiles.includes(fileName)) errors.push(`${fileName} のリンク先が存在しません`);
	}
	for (const fileName of recordFiles) {
		const count = linkedTargets.filter((target) => basename(target) === fileName).length;
		if (count !== 1) errors.push(`${fileName} は索引から 1 回だけ参照する必要があります`);
	}
	for (const trigger of triggerRows) {
		if (!rows.some((row) => row[0] === trigger && row.length === 4 && row.every(Boolean))) {
			errors.push(`待機中トリガー「${trigger}」の 4 列 row がありません`);
		}
	}

	return errors;
}

function validateRepository(): string[] {
	const errors: string[] = [];
	const markdownFiles = readdirSync(betaLaneDir).filter((fileName) => fileName.endsWith(".md"));
	const recordFiles = markdownFiles.filter((fileName) => recordFilePattern.test(fileName)).sort();
	const recognizedFiles = new Set(["README.md", "TEMPLATE.md", ...recordFiles]);

	for (const fileName of markdownFiles) {
		if (!recognizedFiles.has(fileName)) errors.push(`${fileName}: 未認識の Markdown file です`);
	}
	for (const requiredFile of ["README.md", "TEMPLATE.md"]) {
		if (!markdownFiles.includes(requiredFile))
			errors.push(`${requiredFile}: 必須 file がありません`);
	}
	for (const fileName of recordFiles) {
		errors.push(...validateRecord(fileName, readFileSync(join(betaLaneDir, fileName), "utf8")));
	}
	if (markdownFiles.includes("README.md")) {
		errors.push(
			...validateIndex(readFileSync(join(betaLaneDir, "README.md"), "utf8"), recordFiles),
		);
	}

	const packageJson = JSON.parse(
		readFileSync(join(projectRoot, "package.json"), "utf8"),
	) as PackageJson;
	const pins = getPrereleasePins(packageJson);
	errors.push(...validateExactPins(pins));
	errors.push(
		...validateReadmeVersions(readFileSync(join(projectRoot, "README.md"), "utf8"), pins),
	);

	return errors;
}

const validRecordFixture = `# Probe result
- 対象ハブコミット: \`1a08a97\`
- 検証したコミット: \`cb5f86e\`
- 対象の据え置き: docs/dependency-policy.md §8.1 typescript 6.x
- 判定: 部分解消
- 未解決事項: TS 6 isolation remains

## 結論
Result

## 検証した版
Versions

## 通したゲート
| Command | Result |
| --- | --- |
| \`mise run test:run\` | passed |

## ハブへ持ち込むときの手順案
Steps

## 再現手順
\`\`\`bash
# This is not an H1
## This is not an H2
- 判定: 解消
\`\`\`
`;

describe("beta-lane repository contract", () => {
	test("fenced code block 内の見出しとメタデータを無視する", () => {
		expect(validateRecord("2026-10-04-probe.md", validRecordFixture)).toEqual([]);
	});

	test("遡及補正の例外を shadcn/Tailwind record だけに限定する", () => {
		const invalid = validRecordFixture.replace("`1a08a97`", "不明（遡及補正）");
		expect(validateRecord("2026-10-04-probe.md", invalid)).toContain(
			"2026-10-04-probe.md: 固定メタデータ 1 行目が不正です",
		);
	});

	test("prerelease dependency の範囲指定を拒否する", () => {
		const errors = validateExactPins({
			typescript: "^7.1.0-dev.20261001.1",
			next: "16.4.0-canary.57",
			"@playwright/test": "1.64.0-alpha-2026-10-02",
		});
		expect(errors).toEqual(["typescript は nightly の exact prerelease pin ではありません"]);
	});

	test("README の major.minor または channel の不一致を検出する", () => {
		const pins = {
			typescript: "7.1.0-dev.20261001.1",
			next: "16.4.0-canary.57",
			"@playwright/test": "1.64.0-alpha-2026-10-02",
		};
		const readme = `| 言語 | TypeScript | 7.0(nightly) |
| フレームワーク | Next.js | 16.4(canary) |
| E2E テスト | Playwright | 1.64(alpha) |
TypeScript 7.1 / Next.js 16.4 / Playwright 1.64`;
		expect(validateReadmeVersions(readme, pins)).toEqual([
			"typescript の技術スタック表は 7.1(nightly) である必要があります",
		]);
	});

	test("template の H1 直後に固定メタデータ 5 行を置く", () => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		expect(validateTemplateHeader(template)).toEqual([]);
	});

	test.each(templateHeaderLines)("template header line %s の位置と値形式を固定する", (line) => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		const moved = template.replace(line, "<broken>").concat(`\n${line}\n`);
		expect(validateTemplateHeader(moved)).toContain(
			`template header ${templateHeaderLines.indexOf(line) + 1} 行目が不正です`,
		);
	});

	test("template の必須見出しと gate pair を record contract として検査する", () => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		const concreteHeader = validRecordFixture.split("\n").slice(0, 6).join("\n");
		const concreteRecord = template.replace(templateHeaderLines.join("\n"), concreteHeader);
		expect(validateRecord("2026-10-04-template.md", concreteRecord)).toEqual([]);
	});

	for (const [lane, requiredTexts] of eventLaneRequirements) {
		test(`${lane} row が必須証拠を持つ`, () => {
			const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
			expect(validateLaneRow(template, lane, requiredTexts)).toEqual([]);
		});

		test.each(requiredTexts)(`${lane} row から %s を移すと失敗する`, (requiredText) => {
			const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
			const movedOutsideLane = template
				.split("\n")
				.map((line) =>
					line.startsWith(`| ${lane} |`) ? line.replace(requiredText, "<removed>") : line,
				)
				.join("\n")
				.concat(`\n${requiredText}\n`);
			expect(validateLaneRow(movedOutsideLane, lane, requiredTexts)).toContain(
				`${lane} row に「${requiredText}」がありません`,
			);
		});
	}

	test("template が共通 contract とイベントレーンの条件を示す", () => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		for (const requiredText of [
			"## 結論",
			"## 検証した版",
			"## 通したゲート",
			"## ハブへ持ち込むときの注意",
			"## 再現手順",
			"Agent UI",
			"承認待ち",
			"承認済み",
			"却下",
			"ツール結果",
			"ストリーミング中",
			"無改変コピー",
			"fixture-only unit tests",
			"Gate matrix",
			"approval flow",
			"API",
			"persistence",
			"採否はハブ側",
			"TS 7-only codegen",
			"TS 7 stable minor",
			"Node 26",
			"Stable transition",
			"plan amendment",
			"design re-approval",
		]) {
			expect(template).toContain(requiredText);
		}
	});

	test("正しい遡及補正 record を唯一の例外として受け入れる", () => {
		const retrospective = validRecordFixture
			.replace("`1a08a97`", "不明（遡及補正）")
			.replace("`cb5f86e`", "`479bd2a`");
		expect(validateRecord(retrospectiveException, retrospective)).toEqual([]);
	});

	test("遡及補正 record の starter commit を 479bd2a に固定する", () => {
		const retrospective = validRecordFixture
			.replace("`1a08a97`", "不明（遡及補正）")
			.replace("`cb5f86e`", "`deadbee`");
		expect(validateRecord(retrospectiveException, retrospective)).toContain(
			`${retrospectiveException}: 固定メタデータ 2 行目が不正です`,
		);
	});

	test("stable または package と異なる prerelease channel を拒否する", () => {
		expect(
			validateExactPins({
				typescript: "7.1.0",
				next: "16.4.0-alpha.1",
				"@playwright/test": "1.64.0-alpha-2026-10-02",
			}),
		).toEqual([
			"typescript は nightly の exact prerelease pin ではありません",
			"next は canary の exact prerelease pin ではありません",
		]);
	});

	test("gate section に command/result pair を要求する", () => {
		const invalid = validRecordFixture.replace(
			"| Command | Result |\n| --- | --- |\n| `mise run test:run` | passed |",
			"No command result table.",
		);
		expect(validateRecord("2026-10-04-probe.md", invalid)).toContain(
			"2026-10-04-probe.md: 通したゲートに command/result pair がありません",
		);
	});

	test("Agent UI contract の全要素を lane row 内に固定する", () => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		expect(validateAgentUiLane(template)).toEqual([]);
	});

	test.each(agentUiRequiredTexts)("Agent UI row から %s を移すと失敗する", (requiredText) => {
		const template = readFileSync(join(betaLaneDir, "TEMPLATE.md"), "utf8");
		const movedOutsideLane = template
			.split("\n")
			.map((line) =>
				line.startsWith("| Agent UI |") ? line.replace(requiredText, "<removed>") : line,
			)
			.join("\n")
			.concat(`\n${requiredText}\n`);
		expect(validateAgentUiLane(movedOutsideLane)).toContain(
			`Agent UI row に「${requiredText}」がありません`,
		);
	});

	test.each([
		"未取り込み",
		"hub spec `009` R1-R4",
		"ハブ PR #123",
		"https://github.com/Fukuchan77/vaz-agentic-ai-next/pull/123",
	])("具体的な consumer %s を受け入れる", (consumer) => {
		const index = `| 日付 | トピック | 結論 | 取り込み先 | 記録 |
| --- | --- | --- | --- | --- |
| 2026-10-04 | Probe | Passed | ${consumer} | [record](2026-10-04-probe.md) |

| トリガー | 対応要件 | 確認方法 | 最終確認日 |
| --- | --- | --- | --- |
| \`openapi-typescript\` の TS 7 対応 release note | 3.1 | release | 2026-10-03 |
| ハブへの agent-ui source の着地 | 2.1 | hub | 2026-10-03 |
| Node 26 Active LTS | 4.1 | node | 2026-10-03 |`;
		expect(validateIndex(index, ["2026-10-04-probe.md"])).toEqual([]);
	});

	test("具体的でない index consumer を拒否する", () => {
		for (const consumer of ["local spec", "PR someday", "not a spec"]) {
			const index = `| 日付 | トピック | 結論 | 取り込み先 | 記録 |
| --- | --- | --- | --- | --- |
| 2026-10-04 | Probe | Passed | ${consumer} | [record](2026-10-04-probe.md) |

| トリガー | 対応要件 | 確認方法 | 最終確認日 |
| --- | --- | --- | --- |
| \`openapi-typescript\` の TS 7 対応 release note | 3.1 | release | 2026-10-03 |
| ハブへの agent-ui source の着地 | 2.1 | hub | 2026-10-03 |
| Node 26 Active LTS | 4.1 | node | 2026-10-03 |`;
			expect(validateIndex(index, ["2026-10-04-probe.md"])).toContain(
				"索引の取り込み先は hub spec/PR または 未取り込み である必要があります",
			);
		}
	});

	test.each([
		"docs/dependency-policy.md §8.1 typescript 6.x",
		"ADR-0008 agent-ui source landing が未完了",
		"hub spec `009` agent-ui import closure が未確定",
	])("具体的な hold reference %s を受け入れる", (hold) => {
		const valid = validRecordFixture.replace("docs/dependency-policy.md §8.1 typescript 6.x", hold);
		expect(validateRecord("2026-10-04-probe.md", valid)).toEqual([]);
	});

	test.each([
		"§8.1",
		"§8.1 x",
		"docs/dependency-policy.md §8.1 x",
		"ADR",
		"ADR-0008",
		"spec",
		"spec `009`",
		"spec 該当なし",
	])("曖昧な hold reference %s を拒否する", (hold) => {
		const invalid = validRecordFixture.replace(
			"docs/dependency-policy.md §8.1 typescript 6.x",
			hold,
		);
		expect(validateRecord("2026-10-04-probe.md", invalid)).toContain(
			"2026-10-04-probe.md: 対象の据え置きは §8.1、ADR、spec の具体的な障害を参照する必要があります",
		);
	});

	test("index の別 directory link と不明な取り込み先を拒否する", () => {
		const index = `| 日付 | トピック | 結論 | 取り込み先 | 記録 |
| --- | --- | --- | --- | --- |
| 2026-10-04 | Probe | Passed | 後で対応 | [record](../wrong/2026-10-04-probe.md) |

| トリガー | 対応要件 | 確認方法 | 最終確認日 |
| --- | --- | --- | --- |
| \`openapi-typescript\` の TS 7 対応 release note | 3.1 | release | 2026-10-03 |
| ハブへの agent-ui source の着地 | 2.1 | hub | 2026-10-03 |
| Node 26 Active LTS | 4.1 | node | 2026-10-03 |`;
		const errors = validateIndex(index, ["2026-10-04-probe.md"]);
		expect(errors).toContain(
			"../wrong/2026-10-04-probe.md は同じ directory の record link ではありません",
		);
		expect(errors).toContain(
			"索引の取り込み先は hub spec/PR または 未取り込み である必要があります",
		);
	});

	test("対象の据え置きの実質的な該当なしを拒否する", () => {
		const invalid = validRecordFixture.replace(
			"docs/dependency-policy.md §8.1 typescript 6.x",
			"該当なし。",
		);
		expect(validateRecord("2026-10-04-probe.md", invalid)).toContain(
			"2026-10-04-probe.md: 対象の据え置きは §8.1、ADR、spec の具体的な障害を参照する必要があります",
		);
	});

	test("repository の record・index・pin・README が contract に適合する", () => {
		expect(validateRepository()).toEqual([]);
	});
});
