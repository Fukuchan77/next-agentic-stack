import { getCurrentTime } from "@/lib/ai/tools";

const NOW = new Date("2026-01-02T03:04:05Z");

test("getCurrentTime formats the time in the requested time zone", () => {
	const result = getCurrentTime("Asia/Tokyo", NOW);

	expect(result.timeZone).toBe("Asia/Tokyo");
	expect(result.iso).toBe("2026-01-02T03:04:05.000Z");
	expect(result.formatted).toContain("12:04:05");
});

test("getCurrentTime throws on an unknown time zone", () => {
	expect(() => getCurrentTime("Mars/Olympus_Mons", NOW)).toThrow(RangeError);
});
