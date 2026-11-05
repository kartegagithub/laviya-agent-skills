import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listTestCases, listTestCasesPayloadSchema } from "../orchestration/testCases.js";
export function registerListTestCasesTool(deps) {
    deps.server.registerTool("laviya_list_test_cases", {
        title: "List Test Cases",
        description: "List the test cases of a task you can access (title, preconditions, steps, expected result, referenceID) with the latest result and the 5 most recent runs. " +
            "Read-only: opens no run, uses no credit and changes nothing.",
        inputSchema: {
            payload: listTestCasesPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_list_test_cases", deps.logger, async () => {
        const payload = listTestCasesPayloadSchema.parse(input.payload);
        return listTestCases(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=listTestCasesTool.js.map