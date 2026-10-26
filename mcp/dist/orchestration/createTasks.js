import { z } from "zod";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
export const MAX_CREATE_TASKS_BATCH_SIZE = 50;
const taskTypeIDSchema = z
    .union([
    z.literal(0),
    z.literal(10),
    z.literal(20),
    z.literal(30),
    z.literal(40),
    z.literal(50),
    z.literal(60),
    z.literal(70),
    z.literal(80)
])
    .describe("0 Task, 10 Bug, 20 ChangeRequest, 30 Improvement, 40 Debt, 50 Suggestion, 60 Meeting, 70 Story, 80 Epic. Default 0.");
const createTaskItemSchema = z.object({
    referenceID: z.string().trim().min(1).max(100).optional()
        .describe("Stable key of the work-list item (e.g. W-03). Defaults to the 1-based item position."),
    title: z.string().trim().min(1).max(255),
    description: z.string().optional().describe("Plain text; Laviya stores it as escaped HTML."),
    taskTypeID: taskTypeIDSchema.optional(),
    priority: z.number().int().min(0).max(3).optional().describe("0 NoPriority, 1 Low, 2 Medium, 3 High. Default 1."),
    complexity: z.number().int().min(0).max(3).optional().describe("0 Easy, 1 Normal, 2 Hard, 3 Expert. Default 1."),
    estimatedEffortHours: z.number().min(0).max(1000).optional().describe("Estimate in hours; Laviya stores minutes."),
    parentTaskID: z.number().int().positive().optional().describe("Existing task of the same project."),
    parentReferenceID: z.string().trim().min(1).max(100).optional().describe("referenceID of an earlier item of this call."),
    assigneeEmails: z.array(z.string().trim().email()).max(10).optional()
        .describe("E-mails of tenant members to assign. Omit to assign yourself. Assigning others requires PM permission (PM, Director or Admin).")
}).strict();
export const createTasksPayloadSchema = z.object({
    approvedByUser: z.literal(true),
    projectID: z.number().int().positive()
        .describe("Laviya project the user chose for this list (see laviya_list_projects). Never assumed from configuration."),
    methodologyStatusID: z.number().int().positive().optional()
        .describe("Task-creatable status of the project. Defaults to Backlog, Planned, Processing, ..."),
    progressPaymentID: z.number().int().positive().optional(),
    requestKey: z.string().trim().min(1).max(120).optional()
        .describe("Idempotency key. Defaults to a hash of the list, so resending the same list returns the same tasks."),
    tasks: z.array(createTaskItemSchema).min(1).max(MAX_CREATE_TASKS_BATCH_SIZE)
}).strict();
export async function createTasks(client, logger, payload) {
    const projectID = payload.projectID;
    const tasks = payload.tasks.map((item, index) => toRequestItem(item, index));
    validateTaskReferences(tasks);
    const body = {
        projectID,
        methodologyStatusID: payload.methodologyStatusID,
        progressPaymentID: payload.progressPaymentID,
        tasks
    };
    const requestKey = payload.requestKey ?? generateCanonicalRequestKey("CreateTasks", body);
    logger.info("Creating user-approved Laviya tasks", { projectID, count: tasks.length });
    // The backend creates all items in one transaction and replays the stored result for a repeated requestKey,
    // so a retry after a timeout never duplicates tasks.
    const envelope = await client.createTasks({ ...body, requestKey }, requestKey);
    return readData(envelope);
}
function toRequestItem(item, index) {
    return {
        referenceID: item.referenceID ?? String(index + 1),
        title: item.title,
        description: item.description,
        taskTypeID: item.taskTypeID,
        priority: item.priority,
        complexity: item.complexity,
        estimatedEffort: item.estimatedEffortHours === undefined ? undefined : Math.round(item.estimatedEffortHours * 60 * 100) / 100,
        parentTaskID: item.parentTaskID,
        parentReferenceID: item.parentReferenceID,
        assigneeEmails: item.assigneeEmails
    };
}
function validateTaskReferences(tasks) {
    const seenReferenceIDs = new Set();
    for (const [index, item] of tasks.entries()) {
        if (item.parentTaskID && item.parentReferenceID) {
            throw new Error(`tasks[${index}] must not define both parentTaskID and parentReferenceID.`);
        }
        if (item.parentReferenceID && !seenReferenceIDs.has(item.parentReferenceID.toLowerCase())) {
            throw new Error(`tasks[${index}].parentReferenceID "${item.parentReferenceID}" must match the referenceID of an earlier item.`);
        }
        const key = item.referenceID.toLowerCase();
        if (seenReferenceIDs.has(key)) {
            throw new Error(`tasks[${index}].referenceID "${item.referenceID}" is duplicated (case-insensitive).`);
        }
        seenReferenceIDs.add(key);
    }
}
export function readData(envelope) {
    if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
        const record = envelope;
        return record.Data ?? record.data ?? null;
    }
    return null;
}
//# sourceMappingURL=createTasks.js.map