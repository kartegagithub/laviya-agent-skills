import { z } from "zod";
declare const retryPolicySchema: z.ZodObject<{
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    baseDelayMs: z.ZodDefault<z.ZodNumber>;
    maxDelayMs: z.ZodDefault<z.ZodNumber>;
    jitter: z.ZodDefault<z.ZodBoolean>;
    retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
}, z.core.$strict>;
declare const globalConfigSchema: z.ZodObject<{
    baseUrl: z.ZodDefault<z.ZodString>;
    defaultPollIntervalSeconds: z.ZodDefault<z.ZodNumber>;
    defaultLeaseRefreshSeconds: z.ZodDefault<z.ZodNumber>;
    requestTimeoutSeconds: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<{
        error: "error";
        debug: "debug";
        info: "info";
        warn: "warn";
    }>>;
    auth: z.ZodOptional<z.ZodObject<{
        mode: z.ZodOptional<z.ZodEnum<{
            apiKey: "apiKey";
            apiKeyAndBearer: "apiKeyAndBearer";
        }>>;
        headerName: z.ZodOptional<z.ZodString>;
        sendBearerToken: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>>;
    retry: z.ZodDefault<z.ZodObject<{
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        baseDelayMs: z.ZodDefault<z.ZodNumber>;
        maxDelayMs: z.ZodDefault<z.ZodNumber>;
        jitter: z.ZodDefault<z.ZodBoolean>;
        retryOnHttpStatus: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strict>>;
    completion: z.ZodOptional<z.ZodObject<{
        includeTokenUsage: z.ZodBoolean;
    }, z.core.$strict>>;
}, z.core.$strict>;
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