import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { readData } from "./createTasks.js";

export const MAX_SPRINT_TASKS = 100;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value), "Not a valid date.");

export const listSprintsInputSchema = z.object({
  projectID: z.number().int().positive().describe("Laviya project (see laviya_list_projects)."),
  search: z.string().trim().min(1).max(100).optional().describe("Part of the sprint (folder) name.")
}).strict();

export const createSprintPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  projectID: z.number().int().positive().describe("Laviya project the user chose (see laviya_list_projects)."),
  name: z.string().trim().min(1).max(255)
    .describe("Sprint name. An active folder of the project with the same name (case and spaces ignored) is returned instead of creating another one."),
  startDate: dateSchema.optional().describe("YYYY-MM-DD."),
  endDate: dateSchema.optional().describe("YYYY-MM-DD, not before startDate."),
  sortOrder: z.number().int().positive().optional().describe("Position among the project's folders. Default: after the last one.")
}).strict();

export const assignTasksToSprintPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  folderID: z.number().int().positive().describe("Sprint (Laviya folder) id from laviya_list_sprints or laviya_create_sprint."),
  taskIDs: z.array(z.number().int().positive()).min(1).max(MAX_SPRINT_TASKS)
    .describe("Tasks of the sprint's project. If any task is of another project or not accessible, nothing is changed."),
  remove: z.boolean().optional().describe("true removes the tasks from the sprint instead of adding them. Default false.")
}).strict();

export type ListSprintsInput = z.infer<typeof listSprintsInputSchema>;
export type CreateSprintPayload = z.infer<typeof createSprintPayloadSchema>;
export type AssignTasksToSprintPayload = z.infer<typeof assignTasksToSprintPayloadSchema>;

export async function listSprints(client: LaviyaApiClient, logger: Logger, input: ListSprintsInput): Promise<unknown> {
  logger.info("Listing Laviya sprints (folders)", { projectID: input.projectID, hasSearch: Boolean(input.search) });
  return readData(await client.getFolders({ projectID: input.projectID, search: input.search }));
}

export async function createSprint(client: LaviyaApiClient, logger: Logger, payload: CreateSprintPayload): Promise<unknown> {
  if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
    throw new Error("startDate must not be after endDate.");
  }

  logger.info("Creating a Laviya sprint (folder)", { projectID: payload.projectID });
  // Idempotent by project and name on the backend, so a retry returns the same folder.
  return readData(await client.createFolder({
    projectID: payload.projectID,
    name: payload.name,
    startDate: payload.startDate,
    endDate: payload.endDate,
    sortOrder: payload.sortOrder
  }));
}

export async function assignTasksToSprint(client: LaviyaApiClient, logger: Logger, payload: AssignTasksToSprintPayload): Promise<unknown> {
  logger.info("Setting tasks of a Laviya sprint (folder)", { folderID: payload.folderID, count: payload.taskIDs.length, remove: payload.remove === true });
  return readData(await client.setTaskFolders({
    folderID: payload.folderID,
    taskIDs: payload.taskIDs,
    remove: payload.remove ?? false
  }));
}
