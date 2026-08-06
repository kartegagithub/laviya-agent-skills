import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { completeExecution, completeExecutionPayloadSchema, prepareCompletion } from "../orchestration/completeExecution.js";
export function registerCompleteExecutionTool(deps) {
    deps.server.registerTool("laviya_complete_execution", {
        title: "Complete Execution",
        description: "Submit one final output containing a canonical LAVIYA_RESULT. Laviya validates, evaluates, and routes the result server-side.",
        inputSchema: {
            payload: completeExecutionPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_complete_execution", deps.logger, async () => {
        const payload = completeExecutionPayloadSchema.parse(input.payload);
        const prepared = prepareCompletion(payload);
        if (prepared.canonicalization) {
            deps.executionPolicyManager.validateCompletion(payload.aiAgentFlowRunID, payload.taskID, prepared.canonicalization.canonicalResult.executionEvidence);
        }
        const leaseContext = deps.leaseManager.find({
            runId: payload.aiAgentFlowRunID,
            taskId: payload.taskID,
            executionId: payload.aiAgentTaskExecutionID
        });
        if (!leaseContext || leaseContext.executionId !== payload.aiAgentTaskExecutionID) {
            throw new Error("The supplied aiAgentTaskExecutionID does not match an active execution lease.");
        }
        const completionContext = {
            runId: payload.aiAgentFlowRunID,
            taskId: payload.taskID,
            executionId: payload.aiAgentTaskExecutionID
        };
        const paused = deps.leaseManager.pauseForCompletion(completionContext);
        try {
            const result = await completeExecution(deps.client, deps.runtimeConfig, deps.logger, payload, prepared);
            deps.leaseManager.complete(completionContext);
            return result;
        }
        catch (error) {
            if (paused) {
                deps.leaseManager.resumeAfterCompletionFailure(completionContext);
            }
            throw error;
        }
    }));
}
//# sourceMappingURL=completeExecutionTool.js.map