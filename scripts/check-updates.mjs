#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createPrereleaseReport } from "./lib/prerelease-report.ts";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const workspace = readFileSync(new URL("pnpm-workspace.yaml", root), "utf8");
const minimumReleaseAgeMinutes = Number(
	workspace.match(/^minimumReleaseAge:\s*(\d+)/m)?.[1] ?? 1440,
);
const report = await createPrereleaseReport({
	dependencies: { ...pkg.dependencies, ...pkg.devDependencies },
	fetchPackage: (name) => fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}`),
	minimumReleaseAgeMinutes,
	now: new Date(),
});

console.table(report.pinRows);
console.table(report.watchRows);
console.table(report.errorRows);
console.table(report.notices.map((message) => ({ message })));
process.exitCode = report.exitCode;
