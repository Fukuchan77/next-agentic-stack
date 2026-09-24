import type { Clock } from "./clock";

export interface RateLimitOptions {
	/** ウィンドウ内に許可するリクエスト数 */
	limit: number;
	/** ウィンドウ長(ミリ秒) */
	windowMs: number;
	now: Clock;
}

export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	/** ウィンドウがリセットされるまでの秒数(切り上げ) */
	resetSeconds: number;
}

export interface RateLimiter {
	check(key: string): RateLimitResult;
}

interface Window {
	startedAt: number;
	count: number;
}

/**
 * キー(クライアント IP 等)ごとの固定ウィンドウ方式レート制限。
 *
 * 状態はプロセス内メモリに持つため、複数インスタンス / サーバーレスでは
 * インスタンスごとに独立して数える。本番で厳密に制限するなら Redis 等の共有ストアに置き換えること。
 */
export function createRateLimiter({ limit, windowMs, now }: RateLimitOptions): RateLimiter {
	const windows = new Map<string, Window>();

	function prune(at: number) {
		for (const [key, window] of windows) {
			if (at - window.startedAt >= windowMs) windows.delete(key);
		}
	}

	return {
		check(key) {
			const at = now().getTime();
			// キーが際限なく増えてメモリを圧迫しないよう、期限切れのウィンドウを都度掃除する
			prune(at);

			const window = windows.get(key) ?? { startedAt: at, count: 0 };
			const resetSeconds = Math.max(1, Math.ceil((window.startedAt + windowMs - at) / 1000));
			if (window.count >= limit) {
				return { allowed: false, limit, remaining: 0, resetSeconds };
			}

			window.count += 1;
			windows.set(key, window);
			return { allowed: true, limit, remaining: limit - window.count, resetSeconds };
		},
	};
}

/**
 * レート制限のキーにするクライアント識別子。リバースプロキシ(Vercel 等)が付与する
 * X-Forwarded-For の先頭を使う。プロキシを介さずに公開する場合はクライアントが偽装できる点に注意。
 */
export function clientKey(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || request.headers.get("x-real-ip")?.trim() || "anonymous";
}
