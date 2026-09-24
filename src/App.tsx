import { Column, Content, Grid, Theme } from "@carbon/react";
import { UserCard } from "./sections/users/UserCard";
import { useUsers } from "./sections/users/useUsers";

export function App() {
	const users = useUsers();

	return (
		<Theme theme="g10">
			<Content>
				<Grid>
					<Column lg={16} md={8} sm={4}>
						<h1>Vite React Best Practices Template</h1>
					</Column>
					{users.map((user) => (
						<Column key={user.id} lg={4} md={4} sm={4}>
							<UserCard user={user} />
						</Column>
					))}
				</Grid>
			</Content>
		</Theme>
	);
}
