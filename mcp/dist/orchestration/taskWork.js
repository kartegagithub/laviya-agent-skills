import { z } from "zod";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
import { readData } from "./createTasks.js";
export const MAX_DELIVERY_RUN_TASKS = 100;
export const startTaskWorkPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    deliveryRunID: z.number().int().positive().optional()
        .describe("deliveryRunID from laviya_create_tasks or laviya_start_delivery_run. Default: the active run that contains the task, else a new run.")
}).strict();
export const startDeliveryRunPayloadSchema = z.object({
    taskIDs: z.array(z.number().int().positive()).min(1).max(MAX_DELIVERY_RUN_TASKS)
        .describe("Existing Laviya task IDs to deliver in this run."),
    title: z.string().trim().min(1).max(255).optional()
}).strict();
export const completeTaskWorkPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    sessionID: z.number().int().positive()
        .describe("sessionID returned by laviya_start_task_work; the call completes or resumes exactly that session."),
    comment: z.string().trim().min(1).optional().describe("Plain-text completion note added as a task comment."),
    targetStatus: z.string().trim().min(1).optional()
        .describe("Status name, case/space insensitive. Default: the project's Ready for deploy status."),
    methodologyStatusID: z.number().int().positive().optional(),
    workEndedAt: z.string().datetime({ offset: true }).optional()
        .describe("ISO 8601 time the work actually ended. Pass it only when completing late; the server keeps it between the start and now."),
    requestKey: z.string().trim().min(1).max(120).optional()
}).strict();
export async function startTaskWork(client, logger, payload) {
    logger.info("Starting measured AI work on task", { taskID: payload.taskID, deliveryRunID: payload.deliveryRunID });
    // The backend returns the open session when one exists, so the clock keeps its first start time.
    return readData(await client.startTaskWork({ taskID: payload.taskID, deliveryRunID: payload.deliveryRunID }));
}
export async function startDeliveryRun(client, logger, payload) {
    const taskIDs = [...new Set(payload.taskIDs)];
    logger.info("Starting delivery run for existing tasks", { count: taskIDs.length });
    // The backend reuses the active run that already contains any of these tasks, so a retry never creates a second run.
    return readData(await client.startDeliveryRun({ taskIDs, title: payload.title }));
}
export async function completeTaskWork(client, logger, payload) {
    if (payload.targetStatus && payload.methodologyStatusID) {
        throw new Error("Pass either targetStatus or methodologyStatusID, not both.");
    }
    // Keyed on the session only: a retry with a reworded comment or a corrected status still resumes the same session.
    const requestKey = payload.requestKey ?? generateCanonicalRequestKey("CompleteTaskWork", { taskID: payload.taskID, sessionID: payload.sessionID });
    logger.info("Completing measured AI work on task", {
        taskID: payload.taskID,
        hasComment: Boolean(payload.comment),
        hasTargetStatus: Boolean(payload.targetStatus || payload.methodologyStatusID)
    });
    // The backend records effort, status and comment once per session; a retry resumes the missing steps.
    const envelope = await client.completeTaskWork({
        taskID: payload.taskID,
        sessionID: payload.sessionID,
        requestKey,
        comment: payload.comment,
        targetStatusName: payload.targetStatus,
        methodologyStatusID: payload.methodologyStatusID,
        workEndedAt: payload.workEndedAt
    }, requestKey);
    return readData(envelope);
}
//# sourceMappingURL=taskWork.js.map