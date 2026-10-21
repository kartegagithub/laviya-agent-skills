import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const startTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    taskID: number;
}, {
    taskID: number;
}>;
export declare const completeTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    sessionID: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
    targetStatus: z.ZodOptional<z.ZodString>;
    methodologyStatusID: z.ZodOptional<z.ZodNumber>;
    requestKey: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    sessionID: number;
    requestKey?: string | undefined;
    methodologyStatusID?: number | undefined;
    comment?: string | undefined;
    targetStatus?: string | undefined;
}, {
    taskID: number;
    sessionID: number;
    requestKey?: string | undefined;
    methodologyStatusID?: number | undefined;
    comment?: string | undefined;
    targetStatus?: string | undefined;
}>;
export type StartTaskWorkPayload = z.infer<typeof startTaskWorkPayloadSchema>;
export type CompleteTaskWorkPayload = z.infer<typeof completeTaskWorkPayloadSchema>;
export declare function startTaskWork(client: LaviyaApiClient, logger: Logger, payload: StartTaskWorkPayload): Promise<unknown>;
export declare function completeTaskWork(client: LaviyaApiClient, logger: Logger, payload: CompleteTaskWorkPayload): Promise<unknown>;
//# sourceMappingURL=taskWork.d.ts.map