import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const listTaskLinksPayloadSchema: z.ZodObject<{
    taskID: z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>;
}, z.core.$strict>;
export declare const addTaskLinkPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    taskID: z.ZodNumber;
    url: z.ZodString;
}, z.core.$strict>;
export declare const removeTaskLinkPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    taskID: z.ZodNumber;
    linkID: z.ZodNumber;
}, z.core.$strict>;
export type ListTaskLinksPayload = z.infer<typeof listTaskLinksPayloadSchema>;
export type AddTaskLinkPayload = z.infer<typeof addTaskLinkPayloadSchema>;
export type RemoveTaskLinkPayload = z.infer<typeof removeTaskLinkPayloadSchema>;
export declare function listTaskLinks(client: LaviyaApiClient, logger: Logger, payload: ListTaskLinksPayload): Promise<unknown>;
export declare function addTaskLink(client: LaviyaApiClient, logger: Logger, payload: AddTaskLinkPayload): Promise<unknown>;
export declare function removeTaskLink(client: LaviyaApiClient, logger: Logger, payload: RemoveTaskLinkPayload): Promise<unknown>;
//# sourceMappingURL=taskLinks.d.ts.map