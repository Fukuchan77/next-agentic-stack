import { Tile } from "@carbon/react";
import type { User } from "./useUsers";

interface UserCardProps {
	user: User;
}

export function UserCard({ user }: UserCardProps) {
	return <Tile>{user.name}</Tile>;
}
