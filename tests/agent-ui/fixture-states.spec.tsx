import { render, screen } from "@testing-library/react";
import { ToolExecution } from "@/components/agent-ui/ToolExecution";

/**
 * Starter-owned gap fill for spec 001 requirement 2.2 (plan DES-6.1 Amendment 1).
 *
 * The copied hub tests cover pending approval, tool result and streaming, but
 * only smoke-test the approved state and never render a denied tool part.
 * These fixtures cover those two states with the hub components as copied.
 * Fixtures and assertions only: no API, storage or model.
 */

describe("ToolExecution — approved fixture (approval-responded)", () => {
	test("shows the running badge and no approval slot once the approval is answered", () => {
		render(
			<ToolExecution
				toolName="send-email"
				state="approval-responded"
				approvalSlot={<button type="button">承認</button>}
			/>,
		);
		expect(screen.getByText("実行中")).toBeInTheDocument();
		expect(screen.queryByText("承認待ち")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "承認" })).not.toBeInTheDocument();
	});
});

describe("ToolExecution — denied fixture (output-denied)", () => {
	test("shows the denial reason as an alert instead of the completed badge", () => {
		render(
			<ToolExecution
				toolName="send-email"
				state="output-denied"
				errorText="ユーザーが却下しました"
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("ユーザーが却下しました");
		expect(screen.queryByText("完了")).not.toBeInTheDocument();
		expect(screen.queryByText("実行中")).not.toBeInTheDocument();
	});
});
