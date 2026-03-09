import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const feedTaskPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    userRequest: z.ZodOptional<z.ZodString>;
    agentUID: z.ZodOptional<z.ZodString>;
    cancelActiveRun: z.ZodDefault<z.ZodBoolean>;
    requestKey: z.ZodOptional<z.ZodString>;
    attachmentFileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    taskID: number;
    cancelActiveRun: boolean;
    agentUID?: string | undefined;
    requestKey?: string | undefined;
    userRequest?: string | undefined;
    attachmentFileIDs?: number[] | undefined;
}, {
    taskID: number;
    agentUID?: string | undefined;
    requestKey?: string | undefined;
    userRequest?: string | undefined;
    cancelActiveRun?: boolean | undefined;
    attachmentFileIDs?: number[] | undefined;
}>;
export type FeedTaskPayload = z.infer<typeof feedTaskPayloadSchema>;
export declare function feedTask(client: LaviyaApiClient, logger: Logger, payload: FeedTaskPayload): Promise<unknown>;
//# sourceMappingURL=feedTask.d.ts.map