import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** 条件付きクラスを結合し、衝突する Tailwind ユーティリティは後勝ちで 1 つに絞る(shadcn/ui の規約) */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
