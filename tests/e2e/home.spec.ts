import { expect, test } from "@playwright/test";

// AI SDK の UI Message Stream プロトコル(SSE)でモック応答を組み立てる
function uiMessageStream(chunks: object[]): string {
	return `${[...chunks.map((chunk) => JSON.stringify(chunk)), "[DONE]"].map((data) => `data: ${data}\n\n`).join("")}`;
}

test("homepage loads successfully", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "Next Agentic Stack" })).toBeVisible();
	await expect(page.getByLabel("Message")).toBeVisible();
});

test("chat streams an assistant reply", async ({ page }) => {
	let requestBody: unknown;
	await page.route("**/api/chat", async (route) => {
		requestBody = route.request().postDataJSON();
		await route.fulfill({
			status: 200,
			headers: {
				"content-type": "text/event-stream",
				"x-vercel-ai-ui-message-stream": "v1",
			},
			body: uiMessageStream([
				{ type: "start", messageId: "a1" },
				{ type: "text-start", id: "t1" },
				{ type: "text-delta", id: "t1", delta: "Hello from the mocked agent" },
				{ type: "text-end", id: "t1" },
				{ type: "finish" },
			]),
		});
	});

	await page.goto("/");
	await page.getByLabel("Provider").selectOption("ollama");
	await page.getByLabel("Message").fill("Hi");
	await page.getByRole("button", { name: "Send" }).click();

	await expect(page.getByText("Hello from the mocked agent")).toBeVisible();
	expect(requestBody).toMatchObject({ provider: "ollama" });
});
