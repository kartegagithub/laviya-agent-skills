import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { extractExecutionId } from "../orchestration/executionId.js";
import { startExecution, startExecutionInputSchema } from "../orchestration/startExecution.js";
export function registerStartExecutionTool(deps) {
    deps.server.registerTool("laviya_start_execution", {
        title: "Start Execution",
        description: "Start an execution lease in Laviya for the active work item. Also starts local lease refresh management.",
        inputSchema: {
            runId: startExecutionInputSchema.shape.runId,
            taskId: startExecutionInputSchema.shape.taskId,
            executionId: startExecutionInputSchema.shape.executionId
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_start_execution", deps.logger, async () => {
        const parsed = startExecutionInputSchema.parse(input);
        const result = await startExecution(deps.client, deps.logger, parsed);
        const executionId = extractExecutionId(result) ?? parsed.executionId;
        deps.leaseManager.start({
            ...parsed,
            executionId
        });
        if (!executionId) {
            deps.logger.warn("StartExecution response did not contain an execution id.", {
                runId: parsed.runId,
                taskId: parsed.taskId
            });
        }
        return result;
    }));
}
//# sourceMappingURL=startExecutionTool.js.map