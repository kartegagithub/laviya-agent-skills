import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_DOWNLOADED_FILES = 20;
export declare const getTaskPayloadSchema: z.ZodObject<{
    taskID: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    downloadAttachments: z.ZodOptional<z.ZodEnum<["none", "images", "all"]>>;
}, "strict", z.ZodTypeAny, {
    taskID: string | number;
    downloadAttachments?: "none" | "images" | "all" | undefined;
}, {
    taskID: string | number;
    downloadAttachments?: "none" | "images" | "all" | undefined;
}>;
export type GetTaskPayload = z.infer<typeof getTaskPayloadSchema>;
/** Read-only: no run is opened, no credit is used and the task is not changed. */
export declare function getTask(client: LaviyaApiClient, logger: Logger, payload: GetTaskPayload, downloadRoot?: string): Promise<unknown>;
//# sourceMappingURL=getTask.d.ts.map