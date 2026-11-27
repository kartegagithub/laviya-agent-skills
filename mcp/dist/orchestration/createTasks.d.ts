import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_CREATE_TASKS_BATCH_SIZE = 50;
export declare const MAX_CREATE_TASK_LINKS = 10;
export declare const taskLinkUrlSchema: z.ZodString;
export declare const taskTypeIDSchema: z.ZodUnion<readonly [z.ZodLiteral<0>, z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<30>, z.ZodLiteral<40>, z.ZodLiteral<50>, z.ZodLiteral<60>, z.ZodLiteral<70>, z.ZodLiteral<80>]>;
export declare const createTasksPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    projectID: z.ZodNumber;
    methodologyStatusID: z.ZodOptional<z.ZodNumber>;
    progressPaymentID: z.ZodOptional<z.ZodNumber>;
    confirmInactiveProgressPayment: z.ZodOptional<z.ZodBoolean>;
    folderID: z.ZodOptional<z.ZodNumber>;
    requestKey: z.ZodOptional<z.ZodString>;
    tasks: z.ZodArray<z.ZodObject<{
        referenceID: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        taskTypeID: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<0>, z.ZodLiteral<10>, z.ZodLiteral<20>, z.ZodLiteral<30>, z.ZodLiteral<40>, z.ZodLiteral<50>, z.ZodLiteral<60>, z.ZodLiteral<70>, z.ZodLiteral<80>]>>;
        priority: z.ZodOptional<z.ZodNumber>;
        complexity: z.ZodOptional<z.ZodNumber>;
        estimatedEffortHours: z.ZodOptional<z.ZodNumber>;
        parentTaskID: z.ZodOptional<z.ZodNumber>;
        parentReferenceID: z.ZodOptional<z.ZodString>;
        assigneeEmails: z.ZodOptional<z.ZodArray<z.ZodString>>;
        folderID: z.ZodOptional<z.ZodNumber>;
        progressPaymentID: z.ZodOptional<z.ZodNumber>;
        links: z.ZodOptional<z.ZodArray<z.ZodString>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type CreateTasksPayload = z.infer<typeof createTasksPayloadSchema>;
export declare function createTasks(client: LaviyaApiClient, logger: Logger, payload: CreateTasksPayload): Promise<unknown>;
export declare function readData(envelope: unknown): unknown;
//# sourceMappingURL=createTasks.d.ts.map