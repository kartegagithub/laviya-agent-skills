import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_DELIVERY_RUN_TASKS = 100;
export declare const startTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    deliveryRunID: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const startDeliveryRunPayloadSchema: z.ZodObject<{
    taskIDs: z.ZodArray<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const completeTaskWorkPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    sessionID: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
    targetStatus: z.ZodOptional<z.ZodString>;
    methodologyStatusID: z.ZodOptional<z.ZodNumber>;
    workEndedAt: z.ZodOptional<z.ZodString>;
    requestKey: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type StartTaskWorkPayload = z.infer<typeof startTaskWorkPayloadSchema>;
export type CompleteTaskWorkPayload = z.infer<typeof completeTaskWorkPayloadSchema>;
export type StartDeliveryRunPayload = z.infer<typeof startDeliveryRunPayloadSchema>;
export declare function startTaskWork(client: LaviyaApiClient, logger: Logger, payload: StartTaskWorkPayload): Promise<unknown>;
export declare function startDeliveryRun(client: LaviyaApiClient, logger: Logger, payload: StartDeliveryRunPayload): Promise<unknown>;
export declare function completeTaskWork(client: LaviyaApiClient, logger: Logger, payload: CompleteTaskWorkPayload): Promise<unknown>;
//# sourceMappingURL=taskWork.d.ts.map