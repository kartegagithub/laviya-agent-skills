import { z } from "zod";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
import { readData } from "./createTasks.js";
export const startTaskWorkPayloadSchema = z.object({
    taskID: z.number().int().positive()
}).strict();
export const completeTaskWorkPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    sessionID: z.number().int().positive()
        .describe("SessionID returned by laviya_start_task_work; the call completes or resumes exactly that session."),
    comment: z.string().trim().min(1).optional().describe("Plain-text completion note added as a task comment."),
    targetStatus: z.string().trim().min(1).optional()
        .describe("Status name, case/space insensitive. Default: the project's Ready for deploy status."),
    methodologyStatusID: z.number().int().positive().optional(),
    requestKey: z.string().trim().min(1).max(120).optional()
}).strict();
export async function startTaskWork(client, logger, payload) {
    logger.info("Starting measured AI work on task", { taskID: payload.taskID });
    // The backend returns the open session when one exists, so the clock keeps its first start time.
    return readData(await client.startTaskWork({ taskID: payload.taskID }));
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
        methodologyStatusID: payload.methodologyStatusID
    }, requestKey);
    return readData(envelope);
}
//# sourceMappingURL=taskWork.js.map