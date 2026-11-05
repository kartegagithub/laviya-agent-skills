import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { createTestCases, createTestCasesPayloadSchema } from "../orchestration/testCases.js";
export function registerCreateTestCasesTool(deps) {
    deps.server.registerTool("laviya_create_test_cases", {
        title: "Create Test Cases",
        description: "Create or update up to 50 test cases (title, preconditions, steps, expected result) on a task you can access, after the user approved them. " +
            "Each case has your referenceID: a case with the same referenceID on the task is updated instead of added, so repeating the call is harmless. " +
            "The cases show in the task's Test cases area.",
        inputSchema: {
            payload: createTestCasesPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_create_test_cases", deps.logger, async () => {
        const payload = createTestCasesPayloadSchema.parse(input.payload);
        return createTestCases(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=createTestCasesTool.js.map