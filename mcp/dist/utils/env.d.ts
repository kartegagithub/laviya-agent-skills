export declare const logLevels: readonly ["debug", "info", "warn", "error"];
export type LogLevel = (typeof logLevels)[number];
export interface RuntimeEnv {
    apiKey: string;
    baseUrl?: string;
    agentUid?: string;
    logLevel?: LogLevel;
}
export declare function loadRuntimeEnv(env?: NodeJS.ProcessEnv): RuntimeEnv;
//# sourceMappingURL=env.d.ts.map