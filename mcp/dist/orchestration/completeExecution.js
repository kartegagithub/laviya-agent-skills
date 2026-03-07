import { z } from "zod";
import { generateDeterministicRequestKey } from "../utils/requestKey.js";
const taskTypeValues = [0, 10, 20, 30, 40, 50, 60, 70, 80];
const actionInputSchema = z.object({
    actionType: z.string().min(1).optional(),
    actionDetails: z.string().optional(),
    message: z.string().optional(),
    level: z.string().min(1).optional(),
    duration: z.number().int().min(0).optional()
});
const tokenUsageInputSchema = z.object({
    model: z.string().min(1).optional(),
    inputTokens: z.number().int().min(0).optional(),
    outputTokens: z.number().int().min(0).optional(),
    totalTokens: z.number().int().min(0).optional(),
    cost: z.number().min(0).optional(),
    currency: z.string().min(1).optional(),
    providerRequestID: z.string().optional()
});
const generatedTaskInputSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    complexity: z.number().int().min(0).max(3),
    priority: z.number().int().min(0).max(3),
    taskTypeID: z
        .number()
        .int()
        .refine((value) => taskTypeValues.includes(value), "Invalid taskTypeID"),
    estimatedEffort: z.number().min(0)
});
const generatedWikiInputSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
});
export const completeExecutionPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    aiAgentFlowRunID: z.number().int().positive(),
    aiAgentTaskExecutionID: z.number().int().positive().optional(),
    requestKey: z.string().min(1).optional(),
    executionSummary: z.string().min(1),
    errorMessage: z.string().optional().nullable(),
    isFailed: z.boolean(),
    logs: z.array(actionInputSchema).optional(),
    tokenUsages: z.array(tokenUsageInputSchema).optional(),
    tasks: z.array(generatedTaskInputSchema).optional(),
    wikis: z.array(generatedWikiInputSchema).optional(),
    technicalAnalysis: generatedWikiInputSchema.optional()
});
export async function completeExecution(client, runtimeConfig, logger, payload) {
    if (runtimeConfig.completion.requireExecutionSummary && !payload.executionSummary.trim()) {
        throw new Error("executionSummary is required by runtime configuration.");
    }
    const requestKey = payload.requestKey ??
        generateDeterministicRequestKey([
            payload.aiAgentFlowRunID,
            payload.taskID,
            payload.aiAgentTaskExecutionID,
            payload.executionSummary,
            payload.isFailed ? 1 : 0
        ]);
    const normalizedPayload = {
        ...payload,
        requestKey,
        logs: runtimeConfig.completion.includeLogs ? payload.logs : undefined,
        tokenUsages: runtimeConfig.completion.includeTokenUsage ? payload.tokenUsages : undefined
    };
    logger.info("Completing execution", {
        taskID: payload.taskID,
        runID: payload.aiAgentFlowRunID,
        executionID: payload.aiAgentTaskExecutionID,
        requestKey,
        isFailed: payload.isFailed
    });
    return client.completeExecution(normalizedPayload, requestKey);
}
//# sourceMappingURL=completeExecution.js.map