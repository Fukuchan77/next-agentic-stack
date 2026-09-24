import { createChatAgent } from "@/lib/ai/agent";
import { createToolCallingModel } from "./helpers/mockModel";

test("chat agent runs the getCurrentTime tool and then answers", async () => {
	const agent = createChatAgent(
		createToolCallingModel("getCurrentTime", { timeZone: "UTC" }, "It is noon."),
	);

	const result = await agent.generate({ prompt: "What time is it?" });

	expect(result.text).toBe("It is noon.");
	const toolResults = result.steps.flatMap((step) => step.toolResults);
	expect(toolResults).toHaveLength(1);
	expect(toolResults[0]).toMatchObject({
		toolName: "getCurrentTime",
		output: { timeZone: "UTC" },
	});
});
