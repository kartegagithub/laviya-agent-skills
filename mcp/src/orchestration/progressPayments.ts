import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { readData } from "./createTasks.js";

export const MAX_PROGRESS_PAYMENT_TASKS = 100;

export const listProgressPaymentsInputSchema = z.object({
  projectID: z.number().int().positive().describe("Laviya project (see laviya_list_projects)."),
  search: z.string().trim().min(1).max(100).optional().describe("Part of the progress payment name or code.")
}).strict();

export const assignTasksToProgressPaymentPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  progressPaymentID: z.number().int().positive()
    .describe("Progress payment id from laviya_list_progress_payments. To assign, it must have isAssignable: true (manual task selection)."),
  taskIDs: z.array(z.number().int().positive()).min(1).max(MAX_PROGRESS_PAYMENT_TASKS)
    .describe("Tasks of the progress payment's project. If any task is of another project or not accessible, nothing is changed."),
  remove: z.boolean().optional()
    .describe("true clears the progress payment from the tasks that have it instead of assigning it. Default false.")
}).strict();

export type ListProgressPaymentsInput = z.infer<typeof listProgressPaymentsInputSchema>;
export type AssignTasksToProgressPaymentPayload = z.infer<typeof assignTasksToProgressPaymentPayloadSchema>;

export async function listProgressPayments(client: LaviyaApiClient, logger: Logger, input: ListProgressPaymentsInput): Promise<unknown> {
  logger.info("Listing Laviya progress payments", { projectID: input.projectID, hasSearch: Boolean(input.search) });
  return readData(await client.getProgressPayments({ projectID: input.projectID, search: input.search }));
}

export async function assignTasksToProgressPayment(client: LaviyaApiClient, logger: Logger, payload: AssignTasksToProgressPaymentPayload): Promise<unknown> {
  logger.info("Setting the progress payment of Laviya tasks", { progressPaymentID: payload.progressPaymentID, count: payload.taskIDs.length, remove: payload.remove === true });
  return readData(await client.setTaskProgressPayment({
    progressPaymentID: payload.progressPaymentID,
    taskIDs: payload.taskIDs,
    remove: payload.remove ?? false
  }));
}
