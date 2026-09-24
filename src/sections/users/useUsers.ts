export interface User {
	id: string;
	name: string;
}

// レンダーごとに新しい配列を生成すると参照が不安定になり、
// memo 化した子や依存配列の無駄な再評価を誘発するためモジュールスコープに置く
const USERS: User[] = [
	{ id: "1", name: "Javi" },
	{ id: "2", name: "Isma" },
];

export function useUsers(): User[] {
	// TODO: Replace with actual data fetching logic (SWR / TanStack Query)
	return USERS;
}
