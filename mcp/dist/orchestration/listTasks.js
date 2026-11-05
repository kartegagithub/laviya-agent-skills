import { z } from "zod";
import { readData, taskTypeIDSchema } from "./createTasks.js";
export const MAX_LIST_TASKS_PAGE_SIZE = 100;
export const listTasksInputSchema = z.object({
    projectID: z.number().int().positive().optional()
        .describe("Laviya project (see laviya_list_projects). Omit both projectID and project to list every project you can access."),
    project: z.string().trim().min(1).max(100).optional()
        .describe("Project name, part of it, or task prefix (e.g. LVY) instead of projectID. It must match exactly one of your projects."),
    assignedTo: z.enum(["me", "anyone"]).optional()
        .describe("me (default): tasks assigned to you or with an open checklist item of yours. anyone: every task of the projects."),
    status: z.string().trim().min(1).max(500).optional()
        .describe("open (default: all but Verified, Rejected, Completed and Cancelled type statuses), all, or comma-separated status names of the project (e.g. \"Backlog, In Progress\")."),
    search: z.string().trim().min(1).max(100).optional().describe("Part of the task title or task code (e.g. LVY-113)."),
    taskTypeIDs: z.array(taskTypeIDSchema).min(1).max(9).optional()
        .describe("Only these task types: 0 Task, 10 Bug, 20 ChangeRequest, 30 Improvement, 40 Debt, 50 Suggestion, 60 Meeting, 70 Story, 80 Epic."),
    page: z.number().int().positive().optional().describe("1-based page. Default 1."),
    pageSize: z.number().int().min(1).max(MAX_LIST_TASKS_PAGE_SIZE).optional()
        .describe("Default 25, max 100 (one page fits one laviya_start_delivery_run)."),
    lite: z.boolean().optional().describe("true leaves the sprints (folders) of each task out.")
}).strict();
export async function listTasks(client, logger, input) {
    if (input.projectID && input.project) {
        throw new Error("Pass either projectID or project, not both.");
    }
    const projectID = input.projectID ?? (input.project ? await resolveProjectID(client, input.project) : undefined);
    logger.info("Listing Laviya tasks", {
        projectID,
        assignedTo: input.assignedTo ?? "me",
        status: input.status ?? "open",
        page: input.page ?? 1
    });
    return readData(await client.getTasks({
        projectID,
        assignedTo: input.assignedTo,
        status: input.status,
        search: input.search,
        taskTypeIDs: input.taskTypeIDs,
        page: input.page,
        pageSize: input.pageSize,
        lite: input.lite
    }));
}
/**
 * Resolves a project name or task prefix through GetProjects (accessible projects only). Several partial matches are
 * accepted only when exactly one of them has that exact name or prefix.
 */
async function resolveProjectID(client, project) {
    const data = readData(await client.getProjects({ search: project }));
    const projects = (Array.isArray(data) ? data : []).map((item) => {
        const record = (item ?? {});
        return {
            id: Number(record.id ?? record.ID),
            name: String(record.name ?? record.Name ?? ""),
            taskPrefix: String(record.taskPrefix ?? record.TaskPrefix ?? "")
        };
    });
    const wanted = project.trim().toLowerCase();
    const exact = projects.filter((item) => item.name.toLowerCase() === wanted || item.taskPrefix.toLowerCase() === wanted);
    const matches = projects.length > 1 && exact.length === 1 ? exact : projects;
    if (matches.length === 1 && matches[0].id > 0) {
        return matches[0].id;
    }
    if (matches.length === 0) {
        throw new Error(`No project you can access matches "${project}". Use laviya_list_projects to see your projects.`);
    }
    const candidates = matches.map((item) => `${item.name}${item.taskPrefix ? ` (${item.taskPrefix})` : ""} projectID ${item.id}`);
    throw new Error(`"${project}" matches ${matches.length} projects: ${candidates.join("; ")}. Ask the user which one and pass its projectID.`);
}
//# sourceMappingURL=listTasks.js.map