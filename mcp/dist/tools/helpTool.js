import { z } from "zod";
import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
const toolHelpCatalog = [
    {
        name: "laviya_help",
        purpose: "List Laviya MCP tools with usage notes and valid example arguments.",
        example: {
            name: "laviya_help",
            arguments: { toolName: "laviya_get_my_work" }
        }
    },
    {
        name: "laviya_feed_task",
        purpose: "Create or reuse a local-direct run for a task and feed it to agent execution.",
        example: {
            name: "laviya_feed_task",
            arguments: { payload: { taskID: 123 } }
        }
    },
    {
        name: "laviya_get_local_work_status",
        purpose: "Read the current status, latest execution, and artifact counters of a local-direct run.",
        example: {
            name: "laviya_get_local_work_status",
            arguments: { runId: 456 }
        }
    },
    {
        name: "laviya_cancel_local_work",
        purpose: "Cancel a local-direct run and stop its locally managed execution leases.",
        notes: ["This is a destructive operation."],
        example: {
            name: "laviya_cancel_local_work",
            arguments: { payload: { runID: 456, reason: "Work is no longer required." } }
        }
    },
    {
        name: "laviya_add_task_comment",
        purpose: "Append agent output or progress information to a task as a comment.",
        example: {
            name: "laviya_add_task_comment",
            arguments: {
                payload: {
                    taskID: 123,
                    description: "Implemented the requested change and verified the tests."
                }
            }
        }
    },
    {
        name: "laviya_get_my_work",
        purpose: "Get the next eligible orchestration work item for the configured agent.",
        notes: [
            "runId and projectId are optional when provided by runtime configuration.",
            "File bytes are excluded by default."
        ],
        example: {
            name: "laviya_get_my_work",
            arguments: {
                runId: 456,
                includeFileBytes: false,
                previousLogsLimit: 20,
                output: {
                    minify: true,
                    omitFields: ["Data.Files.*.Bytes"]
                }
            }
        }
    },
    {
        name: "laviya_start_execution",
        purpose: "Start the execution for a work item and enable automatic lease refresh.",
        notes: ["executionId is optional when the backend creates or resolves it."],
        example: {
            name: "laviya_start_execution",
            arguments: { runId: 456, taskId: 123 }
        }
    },
    {
        name: "laviya_complete_execution",
        purpose: "Complete an execution with a validated summary and optional generated artifacts.",
        notes: [
            "Provide executionSummary text or executionSummaryObject.",
            "Token usage is optional and must never block completion.",
            "requestKey and aiAgentTaskExecutionID can be resolved by the runtime."
        ],
        example: {
            name: "laviya_complete_execution",
            arguments: {
                payload: {
                    taskID: 123,
                    aiAgentFlowRunID: 456,
                    isFailed: false,
                    executionSummaryObject: {
                        stepRole: "implementation",
                        task: { taskId: 123, runId: 456, stepIndex: 0 },
                        outcome: "success",
                        deliverables: ["Implemented and tested the requested change."],
                        keyDecisions: [],
                        assumptions: [],
                        risks: [],
                        policyCompliance: {
                            mode: "implementation",
                            compliant: true,
                            workspaceChanged: true,
                            performedCapabilities: ["read_workspace", "write_workspace"],
                            notes: []
                        },
                        handoff: {
                            forNextStep: "",
                            questions: [],
                            artifacts: []
                        }
                    },
                    executionEvidence: {
                        performedCapabilities: ["read_workspace", "write_workspace"],
                        workspaceChanged: true,
                        changedFiles: ["src/example.ts"],
                        enforcementLevel: "observed"
                    }
                }
            }
        }
    },
    {
        name: "laviya_report_token_usage",
        purpose: "Report measured token or cost usage separately from execution completion.",
        notes: [
            "This tool is optional. Do not call it when the agent cannot obtain reliable usage data.",
            "At least one token or cost measurement is required when it is called."
        ],
        example: {
            name: "laviya_report_token_usage",
            arguments: {
                payload: {
                    taskID: 123,
                    aiAgentFlowRunID: 456,
                    aiAgentTaskExecutionID: 789,
                    tokenUsages: [
                        {
                            model: "provider-model-name",
                            inputTokens: 1200,
                            outputTokens: 300,
                            totalTokens: 1500
                        }
                    ]
                }
            }
        }
    },
    {
        name: "laviya_diagnostics",
        purpose: "Read secret-free runtime configuration, warnings, and active lease diagnostics.",
        example: {
            name: "laviya_diagnostics",
            arguments: {}
        }
    }
];
const helpInputSchema = z.object({
    toolName: z.string().min(1).optional()
});
export function registerHelpTool(deps) {
    deps.server.registerTool("laviya_help", {
        title: "Laviya Help",
        description: "List Laviya MCP tools, explain what they do, and return valid example calls. Optionally filter by toolName.",
        inputSchema: {
            toolName: helpInputSchema.shape.toolName
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_help", deps.logger, async () => {
        const { toolName } = helpInputSchema.parse(input);
        const tools = toolName
            ? toolHelpCatalog.filter((tool) => tool.name === toolName)
            : toolHelpCatalog;
        if (toolName && tools.length === 0) {
            throw new Error(`Unknown Laviya tool "${toolName}". Call laviya_help without toolName to list available tools.`);
        }
        return {
            usage: "Call a tool with the example.name and example.arguments values shown below.",
            toolCount: tools.length,
            tools
        };
    }));
}
//# sourceMappingURL=helpTool.js.map