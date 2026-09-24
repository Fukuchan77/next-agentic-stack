export interface User {
	id: string;
	name: string;
}

// 呼び出しごとに新しい配列を生成すると参照が不安定になるためモジュールスコープに置く
const USERS: User[] = [
	{ id: "1", name: "Javi" },
	{ id: "2", name: "Isma" },
];

// Server Component から呼ぶデータ取得関数。実データに置き換える際は
// ここで fetch / DB アクセスを行い、クライアントへは結果だけを渡す
export async function getUsers(): Promise<User[]> {
	return USERS;
}
