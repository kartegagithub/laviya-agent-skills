import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_TASK_TAGS = 10;
export declare const tagNameSchema: z.ZodString;
export declare const listTagsInputSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateTaskTagsPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    taskID: z.ZodNumber;
    tags: z.ZodArray<z.ZodString>;
    remove: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type ListTagsInput = z.infer<typeof listTagsInputSchema>;
export type UpdateTaskTagsPayload = z.infer<typeof updateTaskTagsPayloadSchema>;
export declare function listTags(client: LaviyaApiClient, logger: Logger, input: ListTagsInput): Promise<unknown>;
export declare function updateTaskTags(client: LaviyaApiClient, logger: Logger, payload: UpdateTaskTagsPayload): Promise<unknown>;
//# sourceMappingURL=taskTags.d.ts.map