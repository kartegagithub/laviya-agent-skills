import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const addTaskCommentPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    taskID: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AddTaskCommentPayload = z.infer<typeof addTaskCommentPayloadSchema>;
export declare function addTaskComment(client: LaviyaApiClient, logger: Logger, payload: AddTaskCommentPayload, projectRoot?: string): Promise<unknown>;
//# sourceMappingURL=addTaskComment.d.ts.map