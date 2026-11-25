import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const addTaskCommentPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    taskID: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    taskID: number;
    description?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}, {
    taskID: number;
    description?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}>;
export type AddTaskCommentPayload = z.infer<typeof addTaskCommentPayloadSchema>;
export declare function addTaskComment(client: LaviyaApiClient, logger: Logger, payload: AddTaskCommentPayload, projectRoot?: string): Promise<unknown>;
//# sourceMappingURL=addTaskComment.d.ts.map