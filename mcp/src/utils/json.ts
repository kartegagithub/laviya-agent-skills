import { readFile } from "node:fs/promises";

export async function readJsonFileIfExists<T>(filePath: string): Promise<T | undefined> {
  try {
    const content = await readFile(filePath, "utf8");
    return safeParseJson<T>(content, filePath);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export function safeParseJson<T>(raw: string, source = "inline JSON"): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    throw new Error(`Invalid JSON in ${source}: ${message}`);
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
