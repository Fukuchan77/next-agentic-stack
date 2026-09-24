import { renderHook } from "@testing-library/react";
import { useUsers } from "../src/sections/users/useUsers";

test("useUsers returns users with id and name", () => {
	const { result } = renderHook(() => useUsers());

	expect(result.current.length).toBeGreaterThan(0);
	for (const user of result.current) {
		expect(user).toHaveProperty("id");
		expect(user).toHaveProperty("name");
		expect(typeof user.id).toBe("string");
		expect(typeof user.name).toBe("string");
	}
});

test("useUsers returns users with unique ids", () => {
	const { result } = renderHook(() => useUsers());
	const ids = result.current.map((u) => u.id);
	const uniqueIds = new Set(ids);

	expect(uniqueIds.size).toBe(ids.length);
});
