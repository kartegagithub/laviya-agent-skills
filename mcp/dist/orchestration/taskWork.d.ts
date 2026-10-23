import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_DELIVERY_RUN_TASKS = 100;
export declare const startTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    deliveryRunID: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    deliveryRunID?: number | undefined;
}, {
    taskID: number;
    deliveryRunID?: number | undefined;
}>;
export declare const startDeliveryRunPayloadSchema: z.ZodObject<{
    taskIDs: z.ZodArray<z.ZodNumber, "many">;
    title: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    taskIDs: number[];
    title?: string | undefined;
}, {
    taskIDs: number[];
    title?: string | undefined;
}>;
export declare const completeTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    sessionID: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
    targetStatus: z.ZodOptional<z.ZodString>;
    methodologyStatusID: z.ZodOptional<z.ZodNumber>;
    workEndedAt: z.ZodOptional<z.ZodString>;
    requestKey: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    sessionID: number;
    requestKey?: string | undefined;
    methodologyStatusID?: number | undefined;
    comment?: string | undefined;
    targetStatus?: string | undefined;
    workEndedAt?: string | undefined;
}, {
    taskID: number;
    sessionID: number;
    requestKey?: string | undefined;
    methodologyStatusID?: number | undefined;
    comment?: string | undefined;
    targetStatus?: string | undefined;
    workEndedAt?: string | undefined;
}>;
export type StartTaskWorkPayload = z.infer<typeof startTaskWorkPayloadSchema>;
export type CompleteTaskWorkPayload = z.infer<typeof completeTaskWorkPayloadSchema>;
export type StartDeliveryRunPayload = z.infer<typeof startDeliveryRunPayloadSchema>;
export declare function startTaskWork(client: LaviyaApiClient, logger: Logger, payload: StartTaskWorkPayload): Promise<unknown>;
export declare function startDeliveryRun(client: LaviyaApiClient, logger: Logger, payload: StartDeliveryRunPayload): Promise<unknown>;
export declare function completeTaskWork(client: LaviyaApiClient, logger: Logger, payload: CompleteTaskWorkPayload): Promise<unknown>;
//# sourceMappingURL=taskWork.d.ts.map