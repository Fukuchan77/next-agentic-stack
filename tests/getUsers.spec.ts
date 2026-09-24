import { getUsers } from "@/sections/users/getUsers";

test("getUsers returns users with id and name", async () => {
	const users = await getUsers();

	expect(users.length).toBeGreaterThan(0);
	for (const user of users) {
		expect(typeof user.id).toBe("string");
		expect(typeof user.name).toBe("string");
	}
});

test("getUsers returns users with unique ids", async () => {
	const users = await getUsers();
	const ids = users.map((u) => u.id);

	expect(new Set(ids).size).toBe(ids.length);
});
