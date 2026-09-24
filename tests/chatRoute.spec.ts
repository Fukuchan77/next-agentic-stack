// @vitest-environment node
import { POST } from "@/app/api/chat/route";
import { resolveModel } from "@/lib/ai/registry";
import { createStreamingTextModel } from "./helpers/mockModel";

vi.mock("@/lib/ai/registry", () => ({
	resolveModel: vi.fn(),
}));

const userMessage = { id: "m1", role: "user", parts: [{ type: "text", text: "Hi" }] };

function postChat(body: unknown): Promise<Response> {
	return POST(
		new Request("http://localhost/api/chat", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: typeof body === "string" ? body : JSON.stringify(body),
		}),
	);
}

beforeEach(() => {
	vi.mocked(resolveModel).mockReturnValue(createStreamingTextModel("Hello from the mock"));
});

test("POST /api/chat streams the agent response as a UI message stream", async () => {
	const response = await postChat({ messages: [userMessage], provider: "ollama" });

	expect(response.status).toBe(200);
	expect(response.headers.get("x-vercel-ai-ui-message-stream")).toBe("v1");
	expect(await response.text()).toContain("Hello from the mock");
	expect(resolveModel).toHaveBeenCalledWith("ollama", expect.anything());
});

test("POST /api/chat falls back to AI_PROVIDER when no provider is given", async () => {
	vi.stubEnv("AI_PROVIDER", "openai");

	await postChat({ messages: [userMessage] });

	expect(resolveModel).toHaveBeenCalledWith("openai", expect.anything());
	vi.unstubAllEnvs();
});

test.each([
	["invalid JSON", "{"],
	["missing messages", {}],
	["empty messages", { messages: [] }],
	["unknown provider", { messages: [userMessage], provider: "unknown" }],
])("POST /api/chat rejects %s with 400", async (_label, body) => {
	const response = await postChat(body);

	expect(response.status).toBe(400);
	expect(resolveModel).not.toHaveBeenCalled();
});
