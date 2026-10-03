import { connection } from "next/server";
import { parseAiEnv } from "@/lib/ai/env";
import { Chat } from "@/sections/chat/Chat";
import { getUsers } from "@/sections/users/getUsers";
import { UserCard } from "@/sections/users/UserCard";

export default async function HomePage() {
	// 既定プロバイダを実行時の環境変数から決めるため、静的プリレンダーを避ける
	await connection();
	const { AI_PROVIDER } = parseAiEnv();
	const users = await getUsers();

	return (
		<main className="mx-auto grid max-w-3xl gap-8 px-4 py-8">
			<h1 className="text-3xl font-bold">Next Agentic Stack</h1>
			<ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4 p-0">
				{users.map((user) => (
					<li key={user.id}>
						<UserCard user={user} />
					</li>
				))}
			</ul>
			<Chat defaultProvider={AI_PROVIDER} />
		</main>
	);
}
