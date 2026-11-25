import { z } from "zod";
export declare const executionSummarySchema: z.ZodObject<{
    stepRole: z.ZodString;
    task: z.ZodObject<{
        taskId: z.ZodNumber;
        runId: z.ZodNumber;
        stepIndex: z.ZodNumber;
    }, z.core.$strict>;
    outcome: z.ZodEnum<{
        success: "success";
        failed: "failed";
    }>;
    deliverables: z.ZodArray<z.ZodString>;
    keyDecisions: z.ZodArray<z.ZodString>;
    assumptions: z.ZodArray<z.ZodString>;
    risks: z.ZodArray<z.ZodString>;
    policyCompliance: z.ZodOptional<z.ZodObject<{
        mode: z.ZodString;
        compliant: z.ZodBoolean;
        workspaceChanged: z.ZodBoolean;
        performedCapabilities: z.ZodArray<z.ZodString>;
        notes: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    handoff: z.ZodObject<{
        forNextStep: z.ZodString;
        questions: z.ZodArray<z.ZodString>;
        artifacts: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ExecutionSummary = z.infer<typeof executionSummarySchema>;
export declare function parseStructuredExecutionSummary(value: unknown): ExecutionSummary | undefined;
export declare function parseExecutionSummaryText(value: string | undefined): ExecutionSummary | undefined;
//# sourceMappingURL=executionSummary.d.ts.map