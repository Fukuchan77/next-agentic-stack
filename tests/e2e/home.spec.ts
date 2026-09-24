import { expect, test } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: /Vite React Best Practices Template/i }),
	).toBeVisible();
});
