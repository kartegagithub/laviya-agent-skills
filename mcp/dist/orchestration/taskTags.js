import { z } from "zod";
import { readData } from "./createTasks.js";
export const MAX_TASK_TAGS = 10;
export const tagNameSchema = z.string().trim().min(1).max(255);
export const listTagsInputSchema = z.object({
    search: z.string().trim().min(1).max(100).optional()
        .describe("Part of the tag name; case, spaces, '-', '_' and '.' are ignored.")
}).strict();
export const updateTaskTagsPayloadSchema = z.object({
    approvedByUser: z.literal(true),
    taskID: z.number().int().positive(),
    tags: z.array(tagNameSchema).min(1).max(MAX_TASK_TAGS)
        .describe("Tag names. Matched to existing tags ignoring case, spaces, '-', '_' and '.' (Frontend = frontEnd = front-end). " +
        "An unknown name is created as a new tag, unless it looks like a typo of an existing tag: then nothing changes and the error names the existing tag."),
    remove: z.boolean().optional().describe("true removes the tags from the task instead of adding them; never creates tags. Default false.")
}).strict();
export async function listTags(client, logger, input) {
    logger.info("Listing Laviya tags", { hasSearch: Boolean(input.search) });
    return readData(await client.getTags({ search: input.search }));
}
export async function updateTaskTags(client, logger, payload) {
    logger.info("Updating Laviya task tags", { taskID: payload.taskID, count: payload.tags.length, remove: payload.remove === true });
    return readData(await client.updateTaskTags({ taskID: payload.taskID, tags: payload.tags, remove: payload.remove === true }));
}
//# sourceMappingURL=taskTags.js.map