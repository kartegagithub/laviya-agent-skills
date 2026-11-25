import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_TASK_FILE_BYTES: number;
export declare const MAX_FILES_PER_CALL = 20;
export declare const MAX_ASSIGNEES = 10;
declare const fileListSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
}, z.core.$strip>;
export declare const uploadTaskFilePayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    filePath: z.ZodString;
    fileName: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateTaskDescriptionPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    taskID: z.ZodNumber;
    text: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<{
        replace: "replace";
        append: "append";
    }>>;
}, z.core.$strict>;
export declare const assignTaskPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    assigneeEmails: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type UploadTaskFilePayload = z.infer<typeof uploadTaskFilePayloadSchema>;
export type UpdateTaskDescriptionPayload = z.infer<typeof updateTaskDescriptionPayloadSchema>;
export type AssignTaskPayload = z.infer<typeof assignTaskPayloadSchema>;
export type TaskFileList = z.infer<typeof fileListSchema>;
export { fileListSchema };
export interface UploadedTaskFile {
    fileID: number;
    fileName?: string;
    url?: string;
    embedHtml?: string;
    isImage?: boolean;
}
export declare function readTaskFile(projectRoot: string, filePath: string, fileName?: string): Promise<{
    fileName: string;
    contentBase64: string;
}>;
export declare function uploadTaskFile(client: LaviyaApiClient, logger: Logger, projectRoot: string, payload: UploadTaskFilePayload): Promise<UploadedTaskFile>;
/** Uploads the local files (in order) and returns them followed by the already uploaded fileIDs. */
export declare function resolveTaskFileIDs(client: LaviyaApiClient, logger: Logger, projectRoot: string, taskID: number, files: TaskFileList): Promise<number[]>;
export declare function updateTaskDescription(client: LaviyaApiClient, logger: Logger, projectRoot: string, payload: UpdateTaskDescriptionPayload): Promise<unknown>;
export declare function assignTask(client: LaviyaApiClient, logger: Logger, payload: AssignTaskPayload): Promise<unknown>;
//# sourceMappingURL=taskContent.d.ts.map