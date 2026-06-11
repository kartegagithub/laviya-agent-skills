import { type LogLevel } from "../utils/env.js";
import { type GlobalConfig } from "./loadGlobalConfig.js";
import { type PollMode, type ProjectConfig } from "./loadProjectConfig.js";
export interface RuntimeConfig {
    apiKey: string;
    baseUrl: string;
    agentUid?: string;
    logLevel: LogLevel;
    requestTimeoutSeconds: number;
    pollIntervalSeconds: number;
    leaseRefreshSeconds: number;
    retry: GlobalConfig["retry"];
    cwd: string;
    projectRoot: string;
    projectConfig?: ProjectConfig;
    projectConfigPath?: string;
    globalConfigPath?: string;
    pollMode: PollMode;
    runPinning: {
        enabled: boolean;
        runId?: number;
    };
    completion: {
        requireExecutionSummary: boolean;
        autoFailOnMissingSummary: boolean;
        includeLogs: boolean;
        includeTokenUsage: boolean;
    };
    prompt: {
        basePath: string;
        overridePath?: string;
        content: string;
    };
    configWarnings: string[];
}
export interface RuntimeBootstrapOptions {
    cwd?: string;
    globalConfigPath?: string;
}
export declare function buildRuntimeConfig(options?: RuntimeBootstrapOptions): Promise<RuntimeConfig>;
export declare function resolvePromptOverridePath(projectRoot: string, configuredPath?: string): Promise<string | undefined>;
//# sourceMappingURL=mergeConfig.d.ts.map