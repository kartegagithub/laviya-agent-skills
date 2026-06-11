import { z } from "zod";
declare const pollModeSchema: z.ZodEnum<["pull", "long-poll"]>;
declare const projectConfigSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    projectName: z.ZodOptional<z.ZodString>;
    agentProfile: z.ZodString;
    pollMode: z.ZodDefault<z.ZodEnum<["pull", "long-poll"]>>;
    runPinning: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        runId: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        runId?: number | undefined;
    }, {
        runId?: number | undefined;
        enabled?: boolean | undefined;
    }>, {
        enabled: boolean;
        runId?: number | undefined;
    }, {
        runId?: number | undefined;
        enabled?: boolean | undefined;
    }>>;
    promptOverridePath: z.ZodOptional<z.ZodString>;
    completion: z.ZodOptional<z.ZodObject<{
        requireExecutionSummary: z.ZodDefault<z.ZodBoolean>;
        autoFailOnMissingSummary: z.ZodDefault<z.ZodBoolean>;
        includeLogs: z.ZodDefault<z.ZodBoolean>;
        includeTokenUsage: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        includeTokenUsage: boolean;
        requireExecutionSummary: boolean;
        autoFailOnMissingSummary: boolean;
        includeLogs: boolean;
    }, {
        includeTokenUsage?: boolean | undefined;
        requireExecutionSummary?: boolean | undefined;
        autoFailOnMissingSummary?: boolean | undefined;
        includeLogs?: boolean | undefined;
    }>>;
    codingRules: z.ZodOptional<z.ZodObject<{
        cursorRulePath: z.ZodOptional<z.ZodString>;
        vscodeSettingsPath: z.ZodOptional<z.ZodString>;
        codingConventionsPath: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    }, {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    projectId: number;
    agentProfile: string;
    pollMode: "pull" | "long-poll";
    completion?: {
        includeTokenUsage: boolean;
        requireExecutionSummary: boolean;
        autoFailOnMissingSummary: boolean;
        includeLogs: boolean;
    } | undefined;
    projectName?: string | undefined;
    runPinning?: {
        enabled: boolean;
        runId?: number | undefined;
    } | undefined;
    promptOverridePath?: string | undefined;
    codingRules?: {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    } | undefined;
}, {
    projectId: number;
    agentProfile: string;
    completion?: {
        includeTokenUsage?: boolean | undefined;
        requireExecutionSummary?: boolean | undefined;
        autoFailOnMissingSummary?: boolean | undefined;
        includeLogs?: boolean | undefined;
    } | undefined;
    projectName?: string | undefined;
    pollMode?: "pull" | "long-poll" | undefined;
    runPinning?: {
        runId?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    promptOverridePath?: string | undefined;
    codingRules?: {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    } | undefined;
}>;
export type PollMode = z.infer<typeof pollModeSchema>;
export type ProjectConfig = z.infer<typeof projectConfigSchema>;
export interface LoadedProjectConfig {
    config?: ProjectConfig;
    projectRoot: string;
    path?: string;
}
export declare function loadProjectConfig(startCwd?: string): Promise<LoadedProjectConfig>;
export {};
//# sourceMappingURL=loadProjectConfig.d.ts.map