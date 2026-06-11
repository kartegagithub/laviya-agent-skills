import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { getLocalWorkStatus, getLocalWorkStatusInputSchema } from "../orchestration/getLocalWorkStatus.js";
export function registerGetLocalWorkStatusTool(deps) {
    deps.server.registerTool("laviya_get_local_work_status", {
        title: "Get Local Work Status",
        description: "Read runtime status, last execution, and artifact counters for a local-direct run.",
        inputSchema: {
            runId: getLocalWorkStatusInputSchema.shape.runId
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_get_local_work_status", deps.logger, async () => {
        const parsed = getLocalWorkStatusInputSchema.parse(input);
        return getLocalWorkStatus(deps.client, deps.logger, parsed);
    }));
}
//# sourceMappingURL=getLocalWorkStatusTool.js.map