import { Card, CardContent } from "@/components/ui/card";
import type { User } from "./getUsers";

interface UserCardProps {
	user: User;
}

export function UserCard({ user }: UserCardProps) {
	return (
		<Card className="py-4">
			<CardContent className="px-4">{user.name}</CardContent>
		</Card>
	);
}
