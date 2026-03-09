import { getLocalWorkStatus, getLocalWorkStatusInputSchema } from "../orchestration/getLocalWorkStatus.js";
export function registerGetLocalWorkStatusTool(deps) {
    deps.server.registerTool("laviya_get_local_work_status", {
        title: "Get Local Work Status",
        description: "Read runtime status, last execution, and artifact counters for a local-direct run.",
        inputSchema: {
            runId: getLocalWorkStatusInputSchema.shape.runId
        }
    }, async (input) => {
        try {
            const parsed = getLocalWorkStatusInputSchema.parse(input);
            const result = await getLocalWorkStatus(deps.client, deps.logger, parsed);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            deps.logger.error("laviya_get_local_work_status failed", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    });
}
//# sourceMappingURL=getLocalWorkStatusTool.js.map