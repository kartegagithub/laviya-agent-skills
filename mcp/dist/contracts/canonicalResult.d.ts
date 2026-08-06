import { z } from "zod";
export declare const CONTRACT_VERSION: "1.0";
export declare const outputTypeValues: readonly ["analysis_document", "implementation_result", "code_review_result", "test_result", "task_breakdown"];
export declare const agentReportedStatusSchema: z.ZodEnum<["completed", "failed"]>;
export type TaskBreakdownItem = {
    title: string;
    description?: string;
    complexity?: number;
    priority?: number;
    estimatedEffort?: number;
    children?: TaskBreakdownItem[];
};
export declare const canonicalResultSchema: z.ZodDiscriminatedUnion<"outputType", [z.ZodObject<{
    outputType: z.ZodLiteral<"analysis_document">;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            content: string;
            title: string;
        }, {
            content: string;
            title: string;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        title: string;
        summary: string;
        sections: {
            content: string;
            title: string;
        }[];
    }, {
        title: string;
        summary: string;
        sections: {
            content: string;
            title: string;
        }[];
    }>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<["completed", "failed"]>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }>, "many">>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    payload: {
        title: string;
        summary: string;
        sections: {
            content: string;
            title: string;
        }[];
    };
    outputType: "analysis_document";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[];
    agentNotes: string[];
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    payload: {
        title: string;
        summary: string;
        sections: {
            content: string;
            title: string;
        }[];
    };
    outputType: "analysis_document";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments?: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[] | undefined;
    agentNotes?: string[] | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>, z.ZodObject<{
    outputType: z.ZodLiteral<"implementation_result">;
    payload: z.ZodEffects<z.ZodObject<{
        summary: z.ZodString;
        changedFiles: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            change: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            path: string;
            change: string;
        }, {
            path: string;
            change: string;
        }>, "many">;
        tests: z.ZodObject<{
            executed: z.ZodBoolean;
            passed: z.ZodNullable<z.ZodBoolean>;
            details: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        }, {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        }>;
        remainingIssues: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    }, {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    }>, {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    }, {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    }>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<["completed", "failed"]>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }>, "many">>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    payload: {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    };
    outputType: "implementation_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[];
    agentNotes: string[];
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    payload: {
        changedFiles: {
            path: string;
            change: string;
        }[];
        summary: string;
        tests: {
            executed: boolean;
            passed: boolean | null;
            details?: string | undefined;
        };
        remainingIssues: string[];
    };
    outputType: "implementation_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments?: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[] | undefined;
    agentNotes?: string[] | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>, z.ZodObject<{
    outputType: z.ZodLiteral<"code_review_result">;
    payload: z.ZodEffects<z.ZodObject<{
        decision: z.ZodEnum<["approved", "changes_required"]>;
        summary: z.ZodString;
        findings: z.ZodArray<z.ZodObject<{
            severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
            file: z.ZodOptional<z.ZodString>;
            issue: z.ZodString;
            recommendation: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }, {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }>, "many">;
    }, "strict", z.ZodTypeAny, {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    }, {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    }>, {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    }, {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    }>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<["completed", "failed"]>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }>, "many">>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    payload: {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    };
    outputType: "code_review_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[];
    agentNotes: string[];
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    payload: {
        summary: string;
        decision: "approved" | "changes_required";
        findings: {
            severity: "critical" | "high" | "medium" | "low";
            issue: string;
            recommendation: string;
            file?: string | undefined;
        }[];
    };
    outputType: "code_review_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments?: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[] | undefined;
    agentNotes?: string[] | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>, z.ZodObject<{
    outputType: z.ZodLiteral<"test_result">;
    payload: z.ZodEffects<z.ZodObject<{
        summary: z.ZodString;
        executed: z.ZodNumber;
        passed: z.ZodNumber;
        failed: z.ZodNumber;
        skipped: z.ZodNumber;
        details: z.ZodOptional<z.ZodString>;
        criticalFailures: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    }, {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    }>, {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    }, {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    }>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<["completed", "failed"]>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }>, "many">>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    payload: {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    };
    outputType: "test_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[];
    agentNotes: string[];
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    payload: {
        failed: number;
        summary: string;
        executed: number;
        passed: number;
        skipped: number;
        criticalFailures: string[];
        details?: string | undefined;
    };
    outputType: "test_result";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments?: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[] | undefined;
    agentNotes?: string[] | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>, z.ZodObject<{
    outputType: z.ZodLiteral<"task_breakdown">;
    payload: z.ZodObject<{
        summary: z.ZodString;
        tasks: z.ZodArray<z.ZodType<TaskBreakdownItem, z.ZodTypeDef, TaskBreakdownItem>, "many">;
    }, "strict", z.ZodTypeAny, {
        summary: string;
        tasks: TaskBreakdownItem[];
    }, {
        summary: string;
        tasks: TaskBreakdownItem[];
    }>;
    contractVersion: z.ZodLiteral<"1.0">;
    agentReportedStatus: z.ZodEnum<["completed", "failed"]>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        uri: z.ZodString;
        mediaType: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }, {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }>, "many">>;
    agentNotes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    payload: {
        summary: string;
        tasks: TaskBreakdownItem[];
    };
    outputType: "task_breakdown";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[];
    agentNotes: string[];
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    payload: {
        summary: string;
        tasks: TaskBreakdownItem[];
    };
    outputType: "task_breakdown";
    contractVersion: "1.0";
    agentReportedStatus: "completed" | "failed";
    attachments?: {
        uri: string;
        name: string;
        mediaType?: string | undefined;
    }[] | undefined;
    agentNotes?: string[] | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>]>;
export type CanonicalResult = z.infer<typeof canonicalResultSchema>;
//# sourceMappingURL=canonicalResult.d.ts.map