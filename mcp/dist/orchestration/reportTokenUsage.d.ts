import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const reportTokenUsagePayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    aiAgentFlowRunID: z.ZodNumber;
    aiAgentTaskExecutionID: z.ZodOptional<z.ZodNumber>;
    tokenUsages: z.ZodArray<z.ZodObject<{
        measurement: z.ZodEnum<{
            exact: "exact";
            estimated: "estimated";
            unavailable: "unavailable";
        }>;
        measurementSource: z.ZodOptional<z.ZodString>;
        estimationModelVersion: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    requestKey: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ReportTokenUsagePayload = z.infer<typeof reportTokenUsagePayloadSchema>;
export declare function reportTokenUsage(client: LaviyaApiClient, logger: Logger, payload: ReportTokenUsagePayload): Promise<unknown>;
//# sourceMappingURL=reportTokenUsage.d.ts.map