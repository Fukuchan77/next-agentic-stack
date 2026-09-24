import { clientKey, createRateLimiter } from "@/lib/rate-limit";

function fakeClock(start = 0) {
	let at = start;
	return {
		now: () => new Date(at),
		advance: (ms: number) => {
			at += ms;
		},
	};
}

test("rate limiter allows up to the limit and then blocks until the window resets", () => {
	const clock = fakeClock();
	const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: clock.now });

	expect(limiter.check("a")).toMatchObject({ allowed: true, remaining: 1 });
	expect(limiter.check("a")).toMatchObject({ allowed: true, remaining: 0 });
	expect(limiter.check("a")).toMatchObject({ allowed: false, remaining: 0, resetSeconds: 60 });

	clock.advance(59_500);
	expect(limiter.check("a")).toMatchObject({ allowed: false, resetSeconds: 1 });

	clock.advance(500);
	expect(limiter.check("a")).toMatchObject({ allowed: true, remaining: 1 });
});

test("rate limiter counts each key independently", () => {
	const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: fakeClock().now });

	expect(limiter.check("a").allowed).toBe(true);
	expect(limiter.check("b").allowed).toBe(true);
	expect(limiter.check("a").allowed).toBe(false);
});

test.each([
	[{ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }, "203.0.113.1"],
	[{ "x-real-ip": "203.0.113.2" }, "203.0.113.2"],
	[{}, "anonymous"],
])("clientKey(%o) is %s", (headers, expected) => {
	expect(clientKey(new Request("http://localhost", { headers }))).toBe(expected);
});
