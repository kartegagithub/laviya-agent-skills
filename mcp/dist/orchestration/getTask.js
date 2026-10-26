import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { readData } from "./createTasks.js";
export const MAX_DOWNLOADED_FILES = 20;
export const getTaskPayloadSchema = z.object({
    taskID: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)])
        .describe("Numeric task ID or task code (e.g. 11262 or \"LVY-11262\")."),
    downloadAttachments: z.enum(["none", "images", "all"]).optional()
        .describe("Download task attachments to a local temp folder so you can open them (images: screenshots in the description or comments). Default none.")
}).strict();
/** Read-only: no run is opened, no credit is used and the task is not changed. */
export async function getTask(client, logger, payload, downloadRoot = path.join(tmpdir(), "laviya-task-files")) {
    logger.info("Reading Laviya task", { taskID: payload.taskID, downloadAttachments: payload.downloadAttachments ?? "none" });
    const task = readData(await client.getTask(String(payload.taskID)));
    const mode = payload.downloadAttachments ?? "none";
    const attachments = (task?.attachments ?? task?.Attachments);
    if (!task || mode === "none" || !Array.isArray(attachments) || attachments.length === 0) {
        return task;
    }
    const folder = path.join(downloadRoot, safeName(String(task.customTaskID ?? task.CustomTaskID ?? task.taskID ?? payload.taskID)));
    await mkdir(folder, { recursive: true });
    const selected = attachments.filter((file) => mode === "all" || file.isImage).slice(0, MAX_DOWNLOADED_FILES);
    for (const file of selected) {
        try {
            const bytes = await client.downloadFile(file.fileID);
            const localPath = path.join(folder, `${file.fileID}-${safeName(file.fileName ?? "file")}`);
            await writeFile(localPath, bytes);
            file.localPath = localPath;
        }
        catch (error) {
            // One unreadable file must not hide the task; the agent sees which file failed.
            file.downloadError = error instanceof Error ? error.message : String(error);
        }
    }
    return task;
}
// Server file names are untrusted: keep only the base name with safe characters.
function safeName(value) {
    const base = path.basename(value.replace(/\\/g, "/"));
    const cleaned = base.replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/^\.+/, "").slice(0, 120);
    return cleaned || "file";
}
//# sourceMappingURL=getTask.js.map