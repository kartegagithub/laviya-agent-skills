import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { readData, taskLinkUrlSchema } from "./createTasks.js";

export const listTaskLinksPayloadSchema = z.object({
  taskID: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)])
    .describe("Numeric task ID or task code (e.g. 11262 or \"LVY-11262\").")
}).strict();

export const addTaskLinkPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  taskID: z.number().int().positive(),
  url: taskLinkUrlSchema.describe("http(s) link: Figma frame or file, Visily board, GitHub PR/commit/branch/release or any page.")
}).strict();

export const removeTaskLinkPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  taskID: z.number().int().positive(),
  linkID: z.number().int().positive().describe("Link id from laviya_list_task_links or laviya_add_task_link.")
}).strict();

export type ListTaskLinksPayload = z.infer<typeof listTaskLinksPayloadSchema>;
export type AddTaskLinkPayload = z.infer<typeof addTaskLinkPayloadSchema>;
export type RemoveTaskLinkPayload = z.infer<typeof removeTaskLinkPayloadSchema>;

export async function listTaskLinks(client: LaviyaApiClient, logger: Logger, payload: ListTaskLinksPayload): Promise<unknown> {
  logger.info("Listing Laviya task links", { taskID: payload.taskID });
  return readData(await client.getTaskLinks(String(payload.taskID)));
}

export async function addTaskLink(client: LaviyaApiClient, logger: Logger, payload: AddTaskLinkPayload): Promise<unknown> {
  logger.info("Adding a Laviya task link", { taskID: payload.taskID });
  return readData(await client.addTaskLink({ taskID: payload.taskID, url: payload.url }));
}

export async function removeTaskLink(client: LaviyaApiClient, logger: Logger, payload: RemoveTaskLinkPayload): Promise<unknown> {
  logger.info("Removing a Laviya task link", { taskID: payload.taskID, linkID: payload.linkID });
  return readData(await client.removeTaskLink({ taskID: payload.taskID, linkID: payload.linkID }));
}
