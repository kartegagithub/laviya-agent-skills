import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_TASK_FILE_BYTES: number;
export declare const MAX_FILES_PER_CALL = 20;
export declare const MAX_ASSIGNEES = 10;
declare const fileListSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}, {
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}>;
export declare const uploadTaskFilePayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    filePath: z.ZodString;
    fileName: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    filePath: string;
    fileName?: string | undefined;
}, {
    taskID: number;
    filePath: string;
    fileName?: string | undefined;
}>;
export declare const updateTaskDescriptionPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    taskID: z.ZodNumber;
    text: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["append", "replace"]>>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    mode?: "replace" | "append" | undefined;
    text?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}, {
    taskID: number;
    mode?: "replace" | "append" | undefined;
    text?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
}>;
export declare const assignTaskPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    assigneeEmails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    assigneeEmails?: string[] | undefined;
}, {
    taskID: number;
    assigneeEmails?: string[] | undefined;
}>;
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