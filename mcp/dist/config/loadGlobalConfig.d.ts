import { z } from "zod";
declare const retryPolicySchema: z.ZodObject<{
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    baseDelayMs: z.ZodDefault<z.ZodNumber>;
    maxDelayMs: z.ZodDefault<z.ZodNumber>;
    jitter: z.ZodDefault<z.ZodBoolean>;
    retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
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
    baseUrl: z.ZodDefault<z.ZodEffects<z.ZodString, string, string>>;
    defaultPollIntervalSeconds: z.ZodDefault<z.ZodNumber>;
    defaultLeaseRefreshSeconds: z.ZodDefault<z.ZodNumber>;
    requestTimeoutSeconds: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    auth: z.ZodOptional<z.ZodObject<{
        mode: z.ZodOptional<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        mode: z.ZodOptional<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        mode: z.ZodOptional<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>>;
    retry: z.ZodDefault<z.ZodObject<{
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        baseDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        jitter: z.ZodDefault<z.ZodBoolean>;
        retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    }, "strict", z.ZodTypeAny, {
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
}, "strict", z.ZodTypeAny, {
    baseUrl: string;
    defaultPollIntervalSeconds: number;
    defaultLeaseRefreshSeconds: number;
    requestTimeoutSeconds: number;
    logLevel: "debug" | "info" | "warn" | "error";
    retry: {
        maxAttempts: number;
        baseDelayMs: number;
        maxDelayMs: number;
        jitter: boolean;
        retryOnHttpStatus: number[];
    };
    auth?: z.objectOutputType<{
        mode: z.ZodOptional<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}, {
    baseUrl?: string | undefined;
    defaultPollIntervalSeconds?: number | undefined;
    defaultLeaseRefreshSeconds?: number | undefined;
    requestTimeoutSeconds?: number | undefined;
    logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    auth?: z.objectInputType<{
        mode: z.ZodOptional<z.ZodEnum<["apiKey", "apiKeyAndBearer"]>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
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
    warning?: string;
}
export declare const DEFAULT_GLOBAL_CONFIG: GlobalConfig;
export declare function resolveGlobalConfigPath(env?: NodeJS.ProcessEnv): string;
export declare function loadGlobalConfig(configPath?: string): Promise<LoadedGlobalConfig>;
export {};
//# sourceMappingURL=loadGlobalConfig.d.ts.map