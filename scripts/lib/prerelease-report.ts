type JsonResponse = {
	json: () => Promise<unknown>;
	ok: boolean;
	status: number;
};

type FetchPackage = (name: string) => Promise<JsonResponse>;

type PackageManifest = {
	dependencies: Record<string, string>;
	peerDependencies: Record<string, string>;
};

type RegistryMetadata = {
	distTags: Record<string, string>;
	time: Record<string, string>;
	versions: Record<string, PackageManifest>;
};

type PinRow = {
	current: string;
	latest: string;
	name: string;
	stable: string;
};

type WatchRow = {
	dependencyRange?: string;
	latest: string;
	name: string;
	peerRange?: string;
	publishedAt: string;
};

type ErrorRow = {
	message: string;
	name: string;
};

type Report = {
	errorRows: ErrorRow[];
	exitCode: 0 | 1;
	notices: string[];
	pinRows: PinRow[];
	watchRows: WatchRow[];
};

type ReportOptions = {
	dependencies: Record<string, string>;
	fetchPackage: FetchPackage;
	minimumReleaseAgeMinutes: number;
	now: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringRecord(value: unknown, field: string): Record<string, string> {
	if (!isRecord(value)) throw new Error(`${field} is not an object`);

	const entries = Object.entries(value);
	if (entries.some(([, item]) => typeof item !== "string")) {
		throw new Error(`${field} contains a non-string value`);
	}

	return Object.fromEntries(entries.map(([key, item]) => [key, String(item)]));
}

function readManifest(value: unknown, version: string): PackageManifest {
	if (!isRecord(value)) throw new Error(`versions.${version} is not an object`);

	return {
		dependencies: value.dependencies
			? readStringRecord(value.dependencies, `versions.${version}.dependencies`)
			: {},
		peerDependencies: value.peerDependencies
			? readStringRecord(value.peerDependencies, `versions.${version}.peerDependencies`)
			: {},
	};
}

function parseRegistryMetadata(value: unknown): RegistryMetadata {
	if (!isRecord(value)) throw new Error("registry JSON is not an object");

	const distTags = readStringRecord(value["dist-tags"], "dist-tags");
	const time = readStringRecord(value.time, "time");
	if (!isRecord(value.versions)) throw new Error("versions is not an object");

	const versions: Record<string, PackageManifest> = {};
	for (const [version, manifest] of Object.entries(value.versions)) {
		versions[version] = readManifest(manifest, version);
	}

	return { distTags, time, versions };
}

function parseVersion(version: string) {
	const [base, prerelease = ""] = version.split(/-(.*)/s);
	return {
		base,
		channel: prerelease.split(/[.-]/)[0] ?? "",
	};
}

function compareBase(left: string, right: string) {
	const leftParts = left.split(".").map(Number);
	const rightParts = right.split(".").map(Number);

	for (let index = 0; index < 3; index += 1) {
		const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
		if (difference !== 0) return difference;
	}

	return 0;
}

function eligibleVersions(metadata: RegistryMetadata, cutoff: number) {
	return Object.entries(metadata.time).filter(([version, publishedAt]) => {
		if (version === "created" || version === "modified") return false;
		const timestamp = Date.parse(publishedAt);
		return Number.isFinite(timestamp) && timestamp <= cutoff;
	});
}

function latestByPublishedAt(entries: [string, string][]) {
	return entries.toSorted(([, left], [, right]) => Date.parse(left) - Date.parse(right)).at(-1);
}

function latestStable(entries: [string, string][]) {
	return entries
		.filter(([version]) => !version.includes("-"))
		.toSorted(([left], [right]) => compareBase(left, right))
		.at(-1);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

async function loadPackage(name: string, fetchPackage: FetchPackage) {
	const response = await fetchPackage(name);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	return parseRegistryMetadata(await response.json());
}

export async function createPrereleaseReport({
	dependencies,
	fetchPackage,
	minimumReleaseAgeMinutes,
	now,
}: ReportOptions): Promise<Report> {
	const cutoff = now.getTime() - minimumReleaseAgeMinutes * 60 * 1000;
	const pinned = Object.entries(dependencies).filter(([, version]) =>
		/^\d+\.\d+\.\d+-/.test(version),
	);
	const packageNames = [
		...new Set([...pinned.map(([name]) => name), "openapi-typescript", "typescript"]),
	];
	const metadataByPackage = new Map<string, RegistryMetadata>();
	const errorRows: ErrorRow[] = [];

	for (const name of packageNames) {
		try {
			metadataByPackage.set(name, await loadPackage(name, fetchPackage));
		} catch (error) {
			errorRows.push({ message: errorMessage(error), name });
		}
	}

	const pinRows: PinRow[] = [];
	for (const [name, current] of pinned) {
		const metadata = metadataByPackage.get(name);
		if (!metadata) continue;

		const { base, channel } = parseVersion(current);
		const eligible = eligibleVersions(metadata, cutoff);
		const sameChannel = latestByPublishedAt(
			eligible.filter(([version]) => {
				const candidate = parseVersion(version);
				return candidate.channel === channel && compareBase(candidate.base, base) >= 0;
			}),
		)?.[0];
		const stable = latestStable(
			eligible.filter(([version]) => compareBase(parseVersion(version).base, base) >= 0),
		)?.[0];

		pinRows.push({
			current,
			latest: sameChannel && sameChannel !== current ? sameChannel : "(up to date)",
			name,
			stable: stable ?? "-",
		});
	}

	const watchRows: WatchRow[] = [];
	const openapiMetadata = metadataByPackage.get("openapi-typescript");
	if (openapiMetadata) {
		const latestTag = openapiMetadata.distTags.latest;
		const eligible = eligibleVersions(openapiMetadata, cutoff);
		const latest =
			(latestTag && eligible.some(([version]) => version === latestTag)
				? eligible.find(([version]) => version === latestTag)
				: latestStable(eligible)) ?? undefined;
		if (!latest) {
			errorRows.push({
				message: `no release satisfies the ${minimumReleaseAgeMinutes} minute cutoff`,
				name: "openapi-typescript",
			});
		} else {
			const [version, publishedAt] = latest;
			const manifest = openapiMetadata.versions[version];
			if (!manifest) {
				errorRows.push({ message: `versions.${version} is missing`, name: "openapi-typescript" });
			} else {
				watchRows.push({
					dependencyRange: manifest.dependencies.typescript ?? "-",
					latest: version,
					name: "openapi-typescript",
					peerRange: manifest.peerDependencies.typescript ?? "-",
					publishedAt,
				});
			}
		}
	}

	const typescriptMetadata = metadataByPackage.get("typescript");
	if (typescriptMetadata) {
		const stable = latestStable(eligibleVersions(typescriptMetadata, cutoff));
		if (!stable) {
			errorRows.push({
				message: `no stable release satisfies the ${minimumReleaseAgeMinutes} minute cutoff`,
				name: "typescript stable",
			});
		} else {
			watchRows.push({
				latest: stable[0],
				name: "typescript stable",
				publishedAt: stable[1],
			});
		}
	}

	const notices = pinRows.some((row) => row.stable !== "-")
		? [
				"Stable 候補を検知しました。公開から24時間経過後も exact pin を維持した隔離変更で評価し、差分の有無にかかわらず beta-lane 記録を残して mise run のゲートを通してください。",
			]
		: [];

	return {
		errorRows,
		exitCode: errorRows.length === 0 ? 0 : 1,
		notices,
		pinRows,
		watchRows,
	};
}
