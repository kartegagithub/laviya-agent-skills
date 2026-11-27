import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_PROGRESS_PAYMENT_TASKS = 100;
export declare const listProgressPaymentsInputSchema: z.ZodObject<{
    projectID: z.ZodNumber;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const assignTasksToProgressPaymentPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    progressPaymentID: z.ZodNumber;
    taskIDs: z.ZodArray<z.ZodNumber>;
    remove: z.ZodOptional<z.ZodBoolean>;
    confirmInactiveProgressPayment: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type ListProgressPaymentsInput = z.infer<typeof listProgressPaymentsInputSchema>;
export type AssignTasksToProgressPaymentPayload = z.infer<typeof assignTasksToProgressPaymentPayloadSchema>;
export declare function listProgressPayments(client: LaviyaApiClient, logger: Logger, input: ListProgressPaymentsInput): Promise<unknown>;
export declare function assignTasksToProgressPayment(client: LaviyaApiClient, logger: Logger, payload: AssignTasksToProgressPaymentPayload): Promise<unknown>;
//# sourceMappingURL=progressPayments.d.ts.map