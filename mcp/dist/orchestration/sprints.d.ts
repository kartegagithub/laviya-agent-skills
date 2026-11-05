import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_SPRINT_TASKS = 100;
export declare const listSprintsInputSchema: z.ZodObject<{
    projectID: z.ZodNumber;
    search: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    projectID: number;
    search?: string | undefined;
}, {
    projectID: number;
    search?: string | undefined;
}>;
export declare const createSprintPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    projectID: z.ZodNumber;
    name: z.ZodString;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    name: string;
    approvedByUser: true;
    projectID: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
    sortOrder?: number | undefined;
}, {
    name: string;
    approvedByUser: true;
    projectID: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const assignTasksToSprintPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    folderID: z.ZodNumber;
    taskIDs: z.ZodArray<z.ZodNumber, "many">;
    remove: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    folderID: number;
    approvedByUser: true;
    taskIDs: number[];
    remove?: boolean | undefined;
}, {
    folderID: number;
    approvedByUser: true;
    taskIDs: number[];
    remove?: boolean | undefined;
}>;
export type ListSprintsInput = z.infer<typeof listSprintsInputSchema>;
export type CreateSprintPayload = z.infer<typeof createSprintPayloadSchema>;
export type AssignTasksToSprintPayload = z.infer<typeof assignTasksToSprintPayloadSchema>;
export declare function listSprints(client: LaviyaApiClient, logger: Logger, input: ListSprintsInput): Promise<unknown>;
export declare function createSprint(client: LaviyaApiClient, logger: Logger, payload: CreateSprintPayload): Promise<unknown>;
export declare function assignTasksToSprint(client: LaviyaApiClient, logger: Logger, payload: AssignTasksToSprintPayload): Promise<unknown>;
//# sourceMappingURL=sprints.d.ts.map