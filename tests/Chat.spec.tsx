import { useChat } from "@ai-sdk/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chat } from "@/sections/chat/Chat";

vi.mock("@ai-sdk/react", () => ({
	useChat: vi.fn(),
}));

const sendMessage = vi.fn();
const stop = vi.fn();

function mockUseChat(overrides: Partial<ReturnType<typeof useChat>> = {}) {
	vi.mocked(useChat).mockReturnValue({
		messages: [],
		sendMessage,
		stop,
		status: "ready",
		error: undefined,
		...overrides,
	} as unknown as ReturnType<typeof useChat>);
}

beforeEach(() => {
	mockUseChat();
});

test("Chat sends the message with the selected provider", async () => {
	const user = userEvent.setup();
	render(<Chat defaultProvider="anthropic" />);

	await user.selectOptions(screen.getByLabelText("Provider"), "ollama");
	await user.type(screen.getByLabelText("Message"), "Hello{Enter}");

	expect(sendMessage).toHaveBeenCalledWith({ text: "Hello" }, { body: { provider: "ollama" } });
	expect(screen.getByLabelText("Message")).toHaveValue("");
});

test("Chat does not send blank messages", async () => {
	const user = userEvent.setup();
	render(<Chat defaultProvider="anthropic" />);

	await user.type(screen.getByLabelText("Message"), "   {Enter}");

	expect(sendMessage).not.toHaveBeenCalled();
	expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
});

test("Chat renders text and tool parts", () => {
	mockUseChat({
		messages: [
			{ id: "u1", role: "user", parts: [{ type: "text", text: "What time is it?" }] },
			{
				id: "a1",
				role: "assistant",
				parts: [
					{
						type: "tool-getCurrentTime",
						toolCallId: "c1",
						state: "output-available",
						input: { timeZone: "UTC" },
						output: { timeZone: "UTC", iso: "", formatted: "Friday, noon" },
					},
					{ type: "text", text: "It is noon." },
				],
			},
		],
	} as never);
	render(<Chat defaultProvider="anthropic" />);

	expect(screen.getByText("What time is it?")).toBeInTheDocument();
	expect(screen.getByText(/Friday, noon/)).toBeInTheDocument();
	expect(screen.getByText("It is noon.")).toBeInTheDocument();
});

test("Chat shows a stop button while streaming", async () => {
	mockUseChat({ status: "streaming" });
	const user = userEvent.setup();
	render(<Chat defaultProvider="anthropic" />);

	await user.click(screen.getByRole("button", { name: "Stop" }));

	expect(stop).toHaveBeenCalled();
});

test("Chat shows an alert on error", () => {
	mockUseChat({ error: new Error("boom") });
	render(<Chat defaultProvider="anthropic" />);

	expect(screen.getByRole("alert")).toBeInTheDocument();
});
