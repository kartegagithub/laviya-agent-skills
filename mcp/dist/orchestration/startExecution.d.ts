import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const startExecutionInputSchema: z.ZodObject<{
    runId: z.ZodNumber;
    taskId: z.ZodNumber;
    executionId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    runId: number;
    taskId: number;
    executionId?: number | undefined;
}, {
    runId: number;
    taskId: number;
    executionId?: number | undefined;
}>;
export type StartExecutionInput = z.infer<typeof startExecutionInputSchema>;
export declare function startExecution(client: LaviyaApiClient, logger: Logger, input: StartExecutionInput): Promise<unknown>;
//# sourceMappingURL=startExecution.d.ts.map