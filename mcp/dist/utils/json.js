import { readFile } from "node:fs/promises";
export async function readJsonFileIfExists(filePath) {
    try {
        const content = await readFile(filePath, "utf8");
        return safeParseJson(content, filePath);
    }
    catch (error) {
        if (isErrnoException(error) && error.code === "ENOENT") {
            return undefined;
        }
        throw error;
    }
}
export function safeParseJson(raw, source = "inline JSON") {
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown parse error";
        throw new Error(`Invalid JSON in ${source}: ${message}`);
    }
}
function isErrnoException(error) {
    return typeof error === "object" && error !== null && "code" in error;
}
//# sourceMappingURL=json.js.map