import { z } from "zod";
export const startExecutionInputSchema = z.object({
    runId: z.number().int().positive(),
    taskId: z.number().int().positive(),
    executionId: z.number().int().positive().optional()
});
export async function startExecution(client, logger, input) {
    logger.info("Starting execution lease", {
        runId: input.runId,
        taskId: input.taskId,
        executionId: input.executionId
    });
    return client.startExecution(input);
}
//# sourceMappingURL=startExecution.js.map