import { render, screen } from "@testing-library/react";
import { UserCard } from "../src/sections/users/UserCard";

test("UserCard renders the user name", () => {
	render(<UserCard user={{ id: "1", name: "Javi" }} />);

	expect(screen.getByText("Javi")).toBeInTheDocument();
});
