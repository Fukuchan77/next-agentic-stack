// @vitest-environment node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const miseToml = readFileSync(join(projectRoot, "mise.toml"), "utf8");

// The gate must run these tasks one after another: `next typegen` (typecheck) and
// `next build` share `.next`, so running them concurrently races on its contents.
const gateOrder = ["lint", "typecheck", "test:run", "build"] as const;

function taskBlock(name: string): string {
	const header = `[tasks.${name}]`;
	const start = miseToml.indexOf(header);
	if (start === -1) return "";
	const rest = miseToml.slice(start + header.length);
	const next = rest.search(/^\[/m);
	return next === -1 ? rest : rest.slice(0, next);
}

describe("mise gate task", () => {
	const block = taskBlock("gate");

	test("is defined in mise.toml", () => {
		expect(block).not.toBe("");
	});

	test("runs lint, typecheck, test:run and build in order", () => {
		const referenced = [...block.matchAll(/\{\s*task\s*=\s*"([^"]+)"\s*\}/g)].map(
			(match) => match[1],
		);
		expect(referenced).toEqual([...gateOrder]);
	});

	test("does not use depends, which would run the steps in parallel", () => {
		expect(block).not.toMatch(/^\s*depends\s*=/m);
	});

	test.each(gateOrder)("references an existing task: %s", (name) => {
		const header = name.includes(":") ? `"${name}"` : name;
		expect(taskBlock(header)).not.toBe("");
	});
});
