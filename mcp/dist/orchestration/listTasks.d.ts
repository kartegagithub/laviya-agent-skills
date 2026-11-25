import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_LIST_TASKS_PAGE_SIZE = 100;
/** Matches the backend clamp, so (page - 1) * pageSize stays inside a 32-bit int. */
export declare const MAX_LIST_TASKS_PAGE: number;
export declare const listTasksInputSchema: z.ZodObject<{
    projectID: z.ZodOptional<z.ZodNumber>;
    project: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodEnum<{
        me: "me";
        anyone: "anyone";
    }>>;
    status: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    taskTypeIDs: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodLiteral<0>, z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<30>, z.ZodLiteral<40>, z.ZodLiteral<50>, z.ZodLiteral<60>, z.ZodLiteral<70>, z.ZodLiteral<80>]>>>;
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    lite: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type ListTasksInput = z.infer<typeof listTasksInputSchema>;
export declare function listTasks(client: LaviyaApiClient, logger: Logger, input: ListTasksInput): Promise<unknown>;
/**
 * Resolves a project name or task prefix through GetProjects (accessible projects only). Several partial matches are
 * accepted only when exactly one of them has that exact name or prefix.
 */
export declare function resolveProjectID(client: LaviyaApiClient, project: string): Promise<number>;
//# sourceMappingURL=listTasks.d.ts.map