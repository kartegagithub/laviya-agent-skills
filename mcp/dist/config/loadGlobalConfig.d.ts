import { z } from "zod";
declare const retryPolicySchema: z.ZodObject<{
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    baseDelayMs: z.ZodDefault<z.ZodNumber>;
    maxDelayMs: z.ZodDefault<z.ZodNumber>;
    jitter: z.ZodDefault<z.ZodBoolean>;
    retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitter: boolean;
    retryOnHttpStatus: number[];
}, {
    maxAttempts?: number | undefined;
    baseDelayMs?: number | undefined;
    maxDelayMs?: number | undefined;
    jitter?: boolean | undefined;
    retryOnHttpStatus?: number[] | undefined;
}>;
declare const globalConfigSchema: z.ZodObject<{
    baseUrl: z.ZodDefault<z.ZodString>;
    defaultPollIntervalSeconds: z.ZodDefault<z.ZodNumber>;
    defaultLeaseRefreshSeconds: z.ZodDefault<z.ZodNumber>;
    requestTimeoutSeconds: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    auth: z.ZodDefault<z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodDefault<z.ZodString>;
        sendBearerToken: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        mode: "apiKey" | "apiKeyAndBearer";
        headerName: string;
        sendBearerToken: boolean;
    }, {
        mode?: "apiKey" | "apiKeyAndBearer" | undefined;
        headerName?: string | undefined;
        sendBearerToken?: boolean | undefined;
    }>>;
    retry: z.ZodDefault<z.ZodObject<{
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        baseDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        jitter: z.ZodDefault<z.ZodBoolean>;
        retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxAttempts: number;
        baseDelayMs: number;
        maxDelayMs: number;
        jitter: boolean;
        retryOnHttpStatus: number[];
    }, {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
        jitter?: boolean | undefined;
        retryOnHttpStatus?: number[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    defaultPollIntervalSeconds: number;
    defaultLeaseRefreshSeconds: number;
    requestTimeoutSeconds: number;
    logLevel: "debug" | "info" | "warn" | "error";
    auth: {
        mode: "apiKey" | "apiKeyAndBearer";
        headerName: string;
        sendBearerToken: boolean;
    };
    retry: {
        maxAttempts: number;
        baseDelayMs: number;
        maxDelayMs: number;
        jitter: boolean;
        retryOnHttpStatus: number[];
    };
}, {
    baseUrl?: string | undefined;
    defaultPollIntervalSeconds?: number | undefined;
    defaultLeaseRefreshSeconds?: number | undefined;
    requestTimeoutSeconds?: number | undefined;
    logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    auth?: {
        mode?: "apiKey" | "apiKeyAndBearer" | undefined;
        headerName?: string | undefined;
        sendBearerToken?: boolean | undefined;
    } | undefined;
    retry?: {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
        jitter?: boolean | undefined;
        retryOnHttpStatus?: number[] | undefined;
    } | undefined;
}>;
export type RetryPolicyConfig = z.infer<typeof retryPolicySchema>;
export type GlobalConfig = z.infer<typeof globalConfigSchema>;
export interface LoadedGlobalConfig {
    config: GlobalConfig;
    path?: string;
}
export declare const DEFAULT_GLOBAL_CONFIG: GlobalConfig;
export declare function resolveGlobalConfigPath(): string;
export declare function loadGlobalConfig(configPath?: string): Promise<LoadedGlobalConfig>;
export {};
//# sourceMappingURL=loadGlobalConfig.d.ts.map