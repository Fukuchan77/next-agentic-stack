#!/usr/bin/env node
// 依存パッケージの最新状況を確認する(読み取り専用。package.json は書き換えない)。
//
// - 範囲指定(^x.y.z)の依存: `pnpm outdated` に任せる
// - プレリリース版に固定した依存(nightly / canary / alpha): pnpm outdated は同じチャンネルの
//   新しいビルドを報告しないため、npm registry を直接引いて
//   「minimumReleaseAge を満たす最新のプレリリース」と「正式版の公開有無」を表示する
// - @playwright/test は Dependabot の対象外(.github/dependabot.yml の ignore)のため、
//   更新の確認はこのスクリプトが唯一の経路になる。alpha は日付形式とタイムスタンプ形式の
//   版番号が混在するので、版番号ではなく公開日時で「最新」を決める
//
// 使い方: `mise run outdated`(= `pnpm outdated` + このスクリプト)
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const workspace = readFileSync(new URL("pnpm-workspace.yaml", root), "utf8");
const minimumReleaseAgeMinutes = Number(
	workspace.match(/^minimumReleaseAge:\s*(\d+)/m)?.[1] ?? 1440,
);
const cutoff = Date.now() - minimumReleaseAgeMinutes * 60 * 1000;

const deps = { ...pkg.dependencies, ...pkg.devDependencies };
// 範囲指定ではなく、プレリリース版を完全一致で固定しているもの
const pinned = Object.entries(deps).filter(([, spec]) => /^\d+\.\d+\.\d+-/.test(spec));

/** "16.4.0-canary.39" → { base: "16.4.0", channel: "canary" } */
function parse(version) {
	const [base, pre = ""] = version.split(/-(.*)/s);
	return { base, channel: pre.split(/[.-]/)[0] };
}

function compareBase(a, b) {
	const pa = a.split(".").map(Number);
	const pb = b.split(".").map(Number);
	for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
	return 0;
}

const rows = [];
for (const [name, current] of pinned) {
	const response = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}`);
	if (!response.ok) {
		rows.push({ name, current, latest: `registry error ${response.status}`, stable: "-" });
		continue;
	}
	const { time } = await response.json();
	const { base, channel } = parse(current);
	const eligible = Object.entries(time)
		.filter(([version]) => version !== "created" && version !== "modified")
		.filter(([, publishedAt]) => Date.parse(publishedAt) <= cutoff);

	// 同じチャンネルで、minimumReleaseAge を満たす最新のビルド
	const sameChannel = eligible
		.filter(([version]) => parse(version).channel === channel)
		.filter(([version]) => compareBase(parse(version).base, base) >= 0)
		.sort(([, a], [, b]) => Date.parse(a) - Date.parse(b))
		.at(-1)?.[0];
	// 固定しているプレリリースの正式版(以降)が公開済みか
	const stable = eligible
		.map(([version]) => version)
		.filter((version) => !version.includes("-") && compareBase(version, base) >= 0)
		.sort(compareBase)
		.at(-1);

	rows.push({
		name,
		current,
		latest: sameChannel && sameChannel !== current ? sameChannel : "(up to date)",
		stable: stable ?? "-",
	});
}

console.log(
	`\nPrerelease pins (versions published at least ${minimumReleaseAgeMinutes} minutes ago):`,
);
console.table(rows);
if (rows.some((row) => row.stable !== "-")) {
	console.log(
		"A stable release is available for at least one prerelease pin — switch it to a caret range (see README).",
	);
}
