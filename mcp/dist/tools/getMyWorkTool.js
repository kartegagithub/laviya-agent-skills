import { getMyWork, getMyWorkInputSchema } from "../orchestration/getMyWork.js";
export function registerGetMyWorkTool(deps) {
    deps.server.registerTool("laviya_get_my_work", {
        title: "Get My Work",
        description: "Get the next eligible Laviya orchestration work item. Supports run pinning, project-level defaults, and returns language metadata to guide response language.",
        inputSchema: {
            runId: getMyWorkInputSchema.shape.runId,
            projectId: getMyWorkInputSchema.shape.projectId
        }
    }, async (input) => {
        try {
            const parsed = getMyWorkInputSchema.parse(input);
            const result = await getMyWork(deps.client, deps.runtimeConfig, deps.logger, parsed);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            deps.logger.error("laviya_get_my_work failed", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    });
}
//# sourceMappingURL=getMyWorkTool.js.map