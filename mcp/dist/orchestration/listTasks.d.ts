import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_LIST_TASKS_PAGE_SIZE = 100;
export declare const listTasksInputSchema: z.ZodObject<{
    projectID: z.ZodOptional<z.ZodNumber>;
    project: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodEnum<["me", "anyone"]>>;
    status: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    taskTypeIDs: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<30>, z.ZodLiteral<40>, z.ZodLiteral<50>, z.ZodLiteral<60>, z.ZodLiteral<70>, z.ZodLiteral<80>]>, "many">>;
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
    lite: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    search?: string | undefined;
    status?: string | undefined;
    projectID?: number | undefined;
    project?: string | undefined;
    assignedTo?: "me" | "anyone" | undefined;
    taskTypeIDs?: (0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80)[] | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    lite?: boolean | undefined;
}, {
    search?: string | undefined;
    status?: string | undefined;
    projectID?: number | undefined;
    project?: string | undefined;
    assignedTo?: "me" | "anyone" | undefined;
    taskTypeIDs?: (0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80)[] | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    lite?: boolean | undefined;
}>;
export type ListTasksInput = z.infer<typeof listTasksInputSchema>;
export declare function listTasks(client: LaviyaApiClient, logger: Logger, input: ListTasksInput): Promise<unknown>;
//# sourceMappingURL=listTasks.d.ts.map