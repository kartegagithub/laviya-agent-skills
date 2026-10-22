import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { readData } from "./createTasks.js";

export const listProjectsInputSchema = z.object({
  search: z.string().trim().min(1).max(100).optional()
    .describe("Part of the project name, or the exact task prefix (e.g. LVY).")
}).strict();

export type ListProjectsInput = z.infer<typeof listProjectsInputSchema>;

export async function listProjects(
  client: LaviyaApiClient,
  logger: Logger,
  input: ListProjectsInput
): Promise<unknown> {
  logger.info("Listing Laviya projects for task creation", { hasSearch: Boolean(input.search) });
  return readData(await client.getProjects({ search: input.search }));
}
