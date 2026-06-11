import { z } from "zod";
export declare const executionSummarySchema: z.ZodObject<{
    stepRole: z.ZodString;
    task: z.ZodObject<{
        taskId: z.ZodNumber;
        runId: z.ZodNumber;
        stepIndex: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        runId: number;
        taskId: number;
        stepIndex: number;
    }, {
        runId: number;
        taskId: number;
        stepIndex: number;
    }>;
    outcome: z.ZodEnum<["success", "failed"]>;
    deliverables: z.ZodArray<z.ZodString, "many">;
    keyDecisions: z.ZodArray<z.ZodString, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
    risks: z.ZodArray<z.ZodString, "many">;
    policyCompliance: z.ZodOptional<z.ZodObject<{
        mode: z.ZodString;
        compliant: z.ZodBoolean;
        workspaceChanged: z.ZodBoolean;
        performedCapabilities: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        mode: string;
        performedCapabilities: string[];
        workspaceChanged: boolean;
        compliant: boolean;
        notes: string[];
    }, {
        mode: string;
        performedCapabilities: string[];
        workspaceChanged: boolean;
        compliant: boolean;
        notes: string[];
    }>>;
    handoff: z.ZodObject<{
        forNextStep: z.ZodString;
        questions: z.ZodArray<z.ZodString, "many">;
        artifacts: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        forNextStep: string;
        questions: string[];
        artifacts: string[];
    }, {
        forNextStep: string;
        questions: string[];
        artifacts: string[];
    }>;
}, "strict", z.ZodTypeAny, {
    stepRole: string;
    task: {
        runId: number;
        taskId: number;
        stepIndex: number;
    };
    outcome: "success" | "failed";
    deliverables: string[];
    keyDecisions: string[];
    assumptions: string[];
    risks: string[];
    handoff: {
        forNextStep: string;
        questions: string[];
        artifacts: string[];
    };
    policyCompliance?: {
        mode: string;
        performedCapabilities: string[];
        workspaceChanged: boolean;
        compliant: boolean;
        notes: string[];
    } | undefined;
}, {
    stepRole: string;
    task: {
        runId: number;
        taskId: number;
        stepIndex: number;
    };
    outcome: "success" | "failed";
    deliverables: string[];
    keyDecisions: string[];
    assumptions: string[];
    risks: string[];
    handoff: {
        forNextStep: string;
        questions: string[];
        artifacts: string[];
    };
    policyCompliance?: {
        mode: string;
        performedCapabilities: string[];
        workspaceChanged: boolean;
        compliant: boolean;
        notes: string[];
    } | undefined;
}>;
export type ExecutionSummary = z.infer<typeof executionSummarySchema>;
export declare function parseStructuredExecutionSummary(value: unknown): ExecutionSummary | undefined;
export declare function parseExecutionSummaryText(value: string | undefined): ExecutionSummary | undefined;
//# sourceMappingURL=executionSummary.d.ts.map