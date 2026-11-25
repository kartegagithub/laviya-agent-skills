import { z } from "zod";
declare const pollModeSchema: z.ZodEnum<{
    pull: "pull";
    "long-poll": "long-poll";
}>;
declare const projectConfigSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    projectName: z.ZodOptional<z.ZodString>;
    agentProfile: z.ZodString;
    pollMode: z.ZodDefault<z.ZodEnum<{
        pull: "pull";
        "long-poll": "long-poll";
    }>>;
    runPinning: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        runId: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    promptOverridePath: z.ZodOptional<z.ZodString>;
    completion: z.ZodOptional<z.ZodObject<{
        requireExecutionSummary: z.ZodDefault<z.ZodBoolean>;
        autoFailOnMissingSummary: z.ZodDefault<z.ZodBoolean>;
        includeLogs: z.ZodDefault<z.ZodBoolean>;
        includeTokenUsage: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    codingRules: z.ZodOptional<z.ZodObject<{
        cursorRulePath: z.ZodOptional<z.ZodString>;
        vscodeSettingsPath: z.ZodOptional<z.ZodString>;
        codingConventionsPath: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
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