import { z } from "zod";
export declare const CONTRACT_VERSION: "1.0";
export declare const outputTypeValues: readonly ["analysis_document", "implementation_result", "code_review_result", "test_result", "task_breakdown"];
export declare const agentReportedStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
}>;
export type TaskBreakdownItem = {
    title: string;
    description?: string;
    complexity?: number;
    priority?: number;
    estimatedEffort?: number;
    children?: TaskBreakdownItem[];
};
export declare const canonicalResultSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    outputType: z.ZodLiteral<"analysis_document">;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    executionEvidence: z.ZodOptional<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    outputType: z.ZodLiteral<"implementation_result">;
    payload: z.ZodObject<{
        summary: z.ZodString;
        changedFiles: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            change: z.ZodString;
        }, z.core.$strict>>;
        tests: z.ZodObject<{
            executed: z.ZodBoolean;
            passed: z.ZodNullable<z.ZodBoolean>;
            details: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        remainingIssues: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    executionEvidence: z.ZodOptional<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    outputType: z.ZodLiteral<"code_review_result">;
    payload: z.ZodObject<{
        decision: z.ZodEnum<{
            approved: "approved";
            changes_required: "changes_required";
        }>;
        summary: z.ZodString;
        findings: z.ZodArray<z.ZodObject<{
            severity: z.ZodEnum<{
                critical: "critical";
                high: "high";
                medium: "medium";
                low: "low";
            }>;
            file: z.ZodOptional<z.ZodString>;
            issue: z.ZodString;
            recommendation: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    executionEvidence: z.ZodOptional<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    outputType: z.ZodLiteral<"test_result">;
    payload: z.ZodObject<{
        summary: z.ZodString;
        executed: z.ZodNumber;
        passed: z.ZodNumber;
        failed: z.ZodNumber;
        skipped: z.ZodNumber;
        details: z.ZodOptional<z.ZodString>;
        criticalFailures: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    executionEvidence: z.ZodOptional<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    outputType: z.ZodLiteral<"task_breakdown">;
    payload: z.ZodObject<{
        summary: z.ZodString;
        tasks: z.ZodArray<z.ZodType<TaskBreakdownItem, unknown, z.core.$ZodTypeInternals<TaskBreakdownItem, unknown>>>;
    }, z.core.$strict>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    executionEvidence: z.ZodOptional<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>], "outputType">;
export type CanonicalResult = z.infer<typeof canonicalResultSchema>;
//# sourceMappingURL=canonicalResult.d.ts.map