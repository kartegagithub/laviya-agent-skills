import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_CREATE_TASKS_BATCH_SIZE = 50;
export declare const createTasksPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    projectID: z.ZodNumber;
    methodologyStatusID: z.ZodOptional<z.ZodNumber>;
    progressPaymentID: z.ZodOptional<z.ZodNumber>;
    requestKey: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    tasks: z.ZodArray<z.ZodObject<{
        referenceID: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        taskTypeID: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<30>, z.ZodLiteral<40>, z.ZodLiteral<50>, z.ZodLiteral<60>, z.ZodLiteral<70>, z.ZodLiteral<80>]>>;
        priority: z.ZodOptional<z.ZodNumber>;
        complexity: z.ZodOptional<z.ZodNumber>;
        estimatedEffortHours: z.ZodOptional<z.ZodNumber>;
        parentTaskID: z.ZodOptional<z.ZodNumber>;
        parentReferenceID: z.ZodOptional<z.ZodString>;
        assigneeEmails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strict", z.ZodTypeAny, {
        title: string;
        description?: string | undefined;
        priority?: number | undefined;
        referenceID?: string | undefined;
        taskTypeID?: 0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80 | undefined;
        complexity?: number | undefined;
        estimatedEffortHours?: number | undefined;
        parentTaskID?: number | undefined;
        parentReferenceID?: string | undefined;
        assigneeEmails?: string[] | undefined;
    }, {
        title: string;
        description?: string | undefined;
        priority?: number | undefined;
        referenceID?: string | undefined;
        taskTypeID?: 0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80 | undefined;
        complexity?: number | undefined;
        estimatedEffortHours?: number | undefined;
        parentTaskID?: number | undefined;
        parentReferenceID?: string | undefined;
        assigneeEmails?: string[] | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    approvedByUser: true;
    projectID: number;
    tasks: {
        title: string;
        description?: string | undefined;
        priority?: number | undefined;
        referenceID?: string | undefined;
        taskTypeID?: 0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80 | undefined;
        complexity?: number | undefined;
        estimatedEffortHours?: number | undefined;
        parentTaskID?: number | undefined;
        parentReferenceID?: string | undefined;
        assigneeEmails?: string[] | undefined;
    }[];
    title?: string | undefined;
    methodologyStatusID?: number | undefined;
    progressPaymentID?: number | undefined;
    requestKey?: string | undefined;
}, {
    approvedByUser: true;
    projectID: number;
    tasks: {
        title: string;
        description?: string | undefined;
        priority?: number | undefined;
        referenceID?: string | undefined;
        taskTypeID?: 0 | 10 | 50 | 30 | 20 | 40 | 60 | 70 | 80 | undefined;
        complexity?: number | undefined;
        estimatedEffortHours?: number | undefined;
        parentTaskID?: number | undefined;
        parentReferenceID?: string | undefined;
        assigneeEmails?: string[] | undefined;
    }[];
    title?: string | undefined;
    methodologyStatusID?: number | undefined;
    progressPaymentID?: number | undefined;
    requestKey?: string | undefined;
}>;
export type CreateTasksPayload = z.infer<typeof createTasksPayloadSchema>;
export declare function createTasks(client: LaviyaApiClient, logger: Logger, payload: CreateTasksPayload): Promise<unknown>;
export declare function readData(envelope: unknown): unknown;
//# sourceMappingURL=createTasks.d.ts.map