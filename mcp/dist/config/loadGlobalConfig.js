import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { readJsonFileIfExists } from "../utils/json.js";
const retryPolicySchema = z.object({
    maxAttempts: z.number().int().min(1).max(10).default(3),
    baseDelayMs: z.number().int().min(50).max(60_000).default(500),
    maxDelayMs: z.number().int().min(100).max(120_000).default(5_000),
    jitter: z.boolean().default(true),
    retryOnHttpStatus: z.array(z.number().int().min(100).max(599)).default([408, 409, 425, 429, 500, 502, 503, 504])
});
const globalConfigSchema = z.object({
    baseUrl: z.string().url().default("https://api.laviya.app"),
    defaultPollIntervalSeconds: z.number().int().min(1).max(300).default(15),
    defaultLeaseRefreshSeconds: z.number().int().min(5).max(300).default(30),
    requestTimeoutSeconds: z.number().int().min(3).max(300).default(30),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
    auth: z
        .object({
        mode: z.enum(["apiKey", "apiKeyAndBearer"]).default("apiKeyAndBearer"),
        headerName: z.string().min(1).default("X-API-Key"),
        sendBearerToken: z.boolean().default(true)
    })
        .default({ mode: "apiKeyAndBearer", headerName: "X-API-Key", sendBearerToken: true }),
    retry: retryPolicySchema.default({
        maxAttempts: 3,
        baseDelayMs: 500,
        maxDelayMs: 5_000,
        jitter: true,
        retryOnHttpStatus: [408, 409, 425, 429, 500, 502, 503, 504]
    })
});
export const DEFAULT_GLOBAL_CONFIG = globalConfigSchema.parse({});
export function resolveGlobalConfigPath() {
    return join(homedir(), ".laviya", "config", "global.json");
}
export async function loadGlobalConfig(configPath = resolveGlobalConfigPath()) {
    const raw = await readJsonFileIfExists(configPath);
    if (!raw) {
        return {
            config: DEFAULT_GLOBAL_CONFIG,
            path: undefined
        };
    }
    const parsed = globalConfigSchema.safeParse(raw);
    if (!parsed.success) {
        const reasons = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
        throw new Error(`Invalid global config at ${configPath}: ${reasons}`);
    }
    return {
        config: {
            ...DEFAULT_GLOBAL_CONFIG,
            ...parsed.data,
            auth: { ...DEFAULT_GLOBAL_CONFIG.auth, ...parsed.data.auth },
            retry: { ...DEFAULT_GLOBAL_CONFIG.retry, ...parsed.data.retry }
        },
        path: configPath
    };
}
//# sourceMappingURL=loadGlobalConfig.js.map