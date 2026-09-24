import { connection } from "next/server";
import { parseAiEnv } from "@/lib/ai/env";
import { Chat } from "@/sections/chat/Chat";
import { getUsers } from "@/sections/users/getUsers";
import { UserCard } from "@/sections/users/UserCard";
import styles from "./page.module.css";

export default async function HomePage() {
	// 既定プロバイダを実行時の環境変数から決めるため、静的プリレンダーを避ける
	await connection();
	const { AI_PROVIDER } = parseAiEnv();
	const users = await getUsers();

	return (
		<main className={styles.main}>
			<h1>Next Agentic Stack</h1>
			<ul className={styles.users}>
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
