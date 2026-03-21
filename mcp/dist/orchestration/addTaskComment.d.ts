import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const addTaskCommentPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskID: number;
    description: string;
}, {
    taskID: number;
    description: string;
}>;
export type AddTaskCommentPayload = z.infer<typeof addTaskCommentPayloadSchema>;
export declare function addTaskComment(client: LaviyaApiClient, logger: Logger, payload: AddTaskCommentPayload): Promise<unknown>;
//# sourceMappingURL=addTaskComment.d.ts.map