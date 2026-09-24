import type { User } from "./getUsers";
import styles from "./UserCard.module.css";

interface UserCardProps {
	user: User;
}

export function UserCard({ user }: UserCardProps) {
	return <div className={styles.card}>{user.name}</div>;
}
