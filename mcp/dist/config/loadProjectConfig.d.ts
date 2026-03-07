import { z } from "zod";
declare const pollModeSchema: z.ZodEnum<["pull", "long-poll"]>;
declare const projectConfigSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    projectName: z.ZodOptional<z.ZodString>;
    agentProfile: z.ZodString;
    pollMode: z.ZodDefault<z.ZodEnum<["pull", "long-poll"]>>;
    runPinning: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        runId: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        requireExecutionSummary: boolean;
        autoFailOnMissingSummary: boolean;
        includeLogs: boolean;
        includeTokenUsage: boolean;
    }, {
        requireExecutionSummary?: boolean | undefined;
        autoFailOnMissingSummary?: boolean | undefined;
        includeLogs?: boolean | undefined;
        includeTokenUsage?: boolean | undefined;
    }>>;
    codingRules: z.ZodOptional<z.ZodObject<{
        cursorRulePath: z.ZodOptional<z.ZodString>;
        vscodeSettingsPath: z.ZodOptional<z.ZodString>;
        codingConventionsPath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    }, {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    projectId: number;
    agentProfile: string;
    pollMode: "pull" | "long-poll";
    projectName?: string | undefined;
    runPinning?: {
        enabled: boolean;
        runId?: number | undefined;
    } | undefined;
    promptOverridePath?: string | undefined;
    completion?: {
        requireExecutionSummary: boolean;
        autoFailOnMissingSummary: boolean;
        includeLogs: boolean;
        includeTokenUsage: boolean;
    } | undefined;
    codingRules?: {
        cursorRulePath?: string | undefined;
        vscodeSettingsPath?: string | undefined;
        codingConventionsPath?: string | undefined;
    } | undefined;
}, {
    projectId: number;
    agentProfile: string;
    projectName?: string | undefined;
    pollMode?: "pull" | "long-poll" | undefined;
    runPinning?: {
        runId?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    promptOverridePath?: string | undefined;
    completion?: {
        requireExecutionSummary?: boolean | undefined;
        autoFailOnMissingSummary?: boolean | undefined;
        includeLogs?: boolean | undefined;
        includeTokenUsage?: boolean | undefined;
    } | undefined;
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