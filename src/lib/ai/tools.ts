import { tool } from "ai";
import { z } from "zod";
import { type Clock, systemClock } from "@/lib/clock";

export interface CurrentTime {
	timeZone: string;
	iso: string;
	formatted: string;
}

export function getCurrentTime(timeZone: string, now: Date): CurrentTime {
	// 不正なタイムゾーンは Intl が RangeError を投げ、ツールエラーとしてモデルに返る
	const formatted = new Intl.DateTimeFormat("en-US", {
		timeZone,
		dateStyle: "full",
		timeStyle: "long",
	}).format(now);

	return { timeZone, iso: now.toISOString(), formatted };
}

// 時刻は Clock から読む(`new Date()` を直接呼ばない)。テストでは固定時刻の Clock を渡す
export function createGetCurrentTimeTool(now: Clock = systemClock) {
	return tool({
		description: "Get the current date and time in the given IANA time zone.",
		inputSchema: z.object({
			timeZone: z
				.string()
				.default("UTC")
				.describe('IANA time zone name, e.g. "Asia/Tokyo" or "America/New_York"'),
		}),
		execute: async ({ timeZone }) => getCurrentTime(timeZone, now()),
	});
}
