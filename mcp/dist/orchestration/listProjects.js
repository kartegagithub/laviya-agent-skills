import { z } from "zod";
import { readData } from "./createTasks.js";
export const listProjectsInputSchema = z.object({
    search: z.string().trim().min(1).max(100).optional()
        .describe("Part of the project name, or the exact task prefix (e.g. LVY).")
}).strict();
export async function listProjects(client, logger, input) {
    logger.info("Listing Laviya projects for task creation", { hasSearch: Boolean(input.search) });
    return readData(await client.getProjects({ search: input.search }));
}
//# sourceMappingURL=listProjects.js.map