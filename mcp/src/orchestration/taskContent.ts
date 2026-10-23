import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { readData } from "./createTasks.js";

export const MAX_TASK_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES_PER_CALL = 20;
export const MAX_ASSIGNEES = 10;

// Same allow-list as the backend: script-capable types (html, svg, js) are served inline and are not accepted.
const TASK_FILE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".md", ".log", ".json", ".csv", ".xml", ".zip",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".mp4", ".webm", ".mov"
]);

const filePathSchema = z.string().trim().min(1)
  .describe("Local file path (absolute, or relative to the project root). Allowed: images (png, jpg, gif, webp), pdf, txt, md, log, json, csv, xml, zip, Office files, mp4, webm, mov; max 20 MiB.");

const fileListSchema = z.object({
  filePaths: z.array(filePathSchema).max(MAX_FILES_PER_CALL).optional()
    .describe("Local files to upload to the task first; images are shown inline, other files as links."),
  fileIDs: z.array(z.number().int().positive()).max(MAX_FILES_PER_CALL).optional()
    .describe("fileID values already returned by laviya_upload_task_file for the same task.")
});

export const uploadTaskFilePayloadSchema = z.object({
  taskID: z.number().int().positive(),
  filePath: filePathSchema,
  fileName: z.string().trim().min(1).max(180).optional().describe("Name shown in Laviya. Default: the local file name.")
}).strict();

export const updateTaskDescriptionPayloadSchema = z.object({
  taskID: z.number().int().positive(),
  text: z.string().optional().describe("Plain text; Laviya stores it as escaped HTML."),
  mode: z.enum(["append", "replace"]).optional().describe("append (default) adds to the end of the description; replace overwrites it."),
  ...fileListSchema.shape
}).strict();

export const assignTaskPayloadSchema = z.object({
  taskID: z.number().int().positive(),
  assigneeEmails: z.array(z.string().trim().email()).max(MAX_ASSIGNEES).optional()
    .describe("E-mails of tenant members to assign. Omit to assign yourself. Assigning others requires PM permission (PM, Director or Admin).")
}).strict();

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

export async function readTaskFile(projectRoot: string, filePath: string, fileName?: string): Promise<{ fileName: string; contentBase64: string }> {
  const resolved = path.resolve(projectRoot, filePath);
  const info = await stat(resolved).catch(() => undefined);
  if (!info || !info.isFile()) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (info.size === 0 || info.size > MAX_TASK_FILE_BYTES) {
    throw new Error(`${filePath} must be between 1 byte and 20 MiB (it is ${info.size} bytes).`);
  }

  const name = (fileName ?? path.basename(resolved)).trim();
  if (!TASK_FILE_EXTENSIONS.has(path.extname(name).toLowerCase()) || name !== path.basename(name)) {
    throw new Error(`${name} is not an allowed task file. Allowed: ${[...TASK_FILE_EXTENSIONS].join(", ")}.`);
  }

  const content = await readFile(resolved);
  return { fileName: name, contentBase64: content.toString("base64") };
}

export async function uploadTaskFile(
  client: LaviyaApiClient,
  logger: Logger,
  projectRoot: string,
  payload: UploadTaskFilePayload
): Promise<UploadedTaskFile> {
  const file = await readTaskFile(projectRoot, payload.filePath, payload.fileName);
  logger.info("Uploading task file", { taskID: payload.taskID, fileName: file.fileName });
  return readData(await client.uploadTaskFile({ taskID: payload.taskID, ...file })) as UploadedTaskFile;
}

/** Uploads the local files (in order) and returns them followed by the already uploaded fileIDs. */
export async function resolveTaskFileIDs(
  client: LaviyaApiClient,
  logger: Logger,
  projectRoot: string,
  taskID: number,
  files: TaskFileList
): Promise<number[]> {
  const uploadedIDs: number[] = [];
  for (const filePath of files.filePaths ?? []) {
    const uploaded = await uploadTaskFile(client, logger, projectRoot, { taskID, filePath });
    uploadedIDs.push(uploaded.fileID);
  }
  const fileIDs = [...uploadedIDs, ...(files.fileIDs ?? [])];
  if (fileIDs.length > MAX_FILES_PER_CALL) {
    throw new Error(`At most ${MAX_FILES_PER_CALL} files can be shown in one description or comment update.`);
  }
  return fileIDs;
}

export async function updateTaskDescription(
  client: LaviyaApiClient,
  logger: Logger,
  projectRoot: string,
  payload: UpdateTaskDescriptionPayload
): Promise<unknown> {
  if (!payload.text?.trim() && !payload.filePaths?.length && !payload.fileIDs?.length) {
    throw new Error("Pass text, filePaths or fileIDs.");
  }
  // Files are validated locally before anything is uploaded, so a bad path does not leave half the files behind.
  for (const filePath of payload.filePaths ?? []) {
    await readTaskFile(projectRoot, filePath);
  }

  const fileIDs = await resolveTaskFileIDs(client, logger, projectRoot, payload.taskID, payload);
  logger.info("Updating task description", { taskID: payload.taskID, mode: payload.mode ?? "append", fileCount: fileIDs.length });
  return readData(await client.updateTaskDescription({
    taskID: payload.taskID,
    text: payload.text,
    mode: payload.mode,
    fileIDs: fileIDs.length > 0 ? fileIDs : undefined
  }));
}

export async function assignTask(
  client: LaviyaApiClient,
  logger: Logger,
  payload: AssignTaskPayload
): Promise<unknown> {
  logger.info("Assigning task", { taskID: payload.taskID, assigneeCount: payload.assigneeEmails?.length ?? 0 });
  return readData(await client.addTaskAssignees({ taskID: payload.taskID, assigneeEmails: payload.assigneeEmails }));
}
