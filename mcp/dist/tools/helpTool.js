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
        purpose: "Append agent output or progress information to a task as a comment, optionally with screenshots or files.",
        notes: [
            "filePaths are local files uploaded to the task attachments first; fileIDs are files already uploaded with laviya_upload_task_file. Images are shown inline in the comment, other files as links."
        ],
        example: {
            name: "laviya_add_task_comment",
            arguments: {
                payload: {
                    taskID: 123,
                    description: "Implemented the requested change and verified the tests.",
                    filePaths: ["artifacts/after.png"]
                }
            }
        }
    },
    {
        name: "laviya_get_task",
        purpose: "Read a task by ID or code: title, description, status, people, attachments, sub tasks, latest comments and design links.",
        notes: [
            "Read-only: no run is opened, no credit is used and the task is not changed. Only tasks of projects you can access are returned.",
            "description is plain text: images in it appear as [image: /api/ai/GetFile?id=N] lines; descriptionHtml keeps the original markup.",
            "downloadAttachments: images saves image attachments (screenshots) to a local temp folder and returns localPath for each, so you can open them; all saves every attachment (max 20)."
        ],
        example: {
            name: "laviya_get_task",
            arguments: { payload: { taskID: "LVY-11262", downloadAttachments: "images" } }
        }
    },
    {
        name: "laviya_upload_task_file",
        purpose: "Upload a local file to a task's attachments (screenshots, documents, logs, archives, videos).",
        notes: [
            "Allowed: png, jpg, jpeg, gif, webp, pdf, txt, md, log, json, csv, xml, zip, doc(x), xls(x), ppt(x), mp4, webm, mov; max 20 MiB. Relative paths resolve from the project root.",
            "Returns fileID, url and embedHtml. Pass fileID to laviya_update_task_description or laviya_add_task_comment to show the file there. Not retried automatically: check the task before uploading the same file again."
        ],
        example: {
            name: "laviya_upload_task_file",
            arguments: { payload: { taskID: 123, filePath: "docs/spec.pdf" } }
        }
    },
    {
        name: "laviya_update_task_description",
        purpose: "Add text and images/files to a task's description, or replace the description.",
        notes: [
            "mode append (default) keeps the current description and adds to its end; replace overwrites it, so use it only when the user asks.",
            "text is plain text. Local filePaths are uploaded to the task attachments first; images are shown inline, other files as links."
        ],
        example: {
            name: "laviya_update_task_description",
            arguments: { payload: { taskID: 123, text: "Current layout on mobile:", filePaths: ["screenshots/mobile.png"] } }
        }
    },
    {
        name: "laviya_assign_task",
        purpose: "Assign a task to yourself or, with PM permission, to other tenant members.",
        notes: [
            "Without assigneeEmails the task is assigned to you. Only PM, Director and Admin users can assign other people; for other roles the call is rejected (HTTP 403), so ask the user to assign it in Laviya.",
            "Existing assignees are kept; assigning someone twice is harmless."
        ],
        example: {
            name: "laviya_assign_task",
            arguments: { payload: { taskID: 123, assigneeEmails: ["teammate@example.com"] } }
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
        purpose: "Submit one final output; Laviya canonicalizes, evaluates, and routes it server-side.",
        notes: [
            "Provide exactly one JSON result or LAVIYA_RESULT block in finalOutput.",
            "aiAgentTaskExecutionID is required and must match the active lease.",
            "Do not choose wiki, task, comment, artifact, status, or next-step destinations."
        ],
        example: {
            name: "laviya_complete_execution",
            arguments: {
                payload: {
                    taskID: 123,
                    aiAgentFlowRunID: 456,
                    aiAgentTaskExecutionID: 789,
                    finalOutput: "<LAVIYA_RESULT>{\"contractVersion\":\"1.0\",\"outputType\":\"implementation_result\",\"agentReportedStatus\":\"completed\",\"payload\":{\"summary\":\"Implemented and tested.\",\"changedFiles\":[],\"tests\":{\"executed\":true,\"passed\":true},\"remainingIssues\":[]}}</LAVIYA_RESULT>"
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
                            measurement: "exact",
                            measurementSource: "provider-response",
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
        name: "laviya_list_projects",
        purpose: "List the Laviya projects the api key owner can access, so the user can choose by name where tasks are created.",
        notes: ["search matches part of the project name or the exact task prefix (e.g. LVY)."],
        example: {
            name: "laviya_list_projects",
            arguments: { search: "mobile" }
        }
    },
    {
        name: "laviya_create_tasks",
        purpose: "Create tasks from a work list the user explicitly approved and return taskID and customTaskID per referenceID.",
        notes: [
            "Only call after the user approved the exact list; approvedByUser must be true. Never call it during an orchestrated execution.",
            "projectID is required: ask the user which project, using laviya_list_projects to show names. It is never taken from configuration, so each list can go to a different project.",
            "The status defaults to the project's first task-creatable status (Backlog first).",
            "taskTypeID: 0 Task, 10 Bug, 20 ChangeRequest, 30 Improvement, 40 Debt, 50 Suggestion, 60 Meeting, 70 Story, 80 Epic. priority: 0 NoPriority, 1 Low, 2 Medium, 3 High. complexity: 0 Easy, 1 Normal, 2 Hard, 3 Expert.",
            "Use parentReferenceID to nest an item under an earlier item of the same call, or parentTaskID for an existing task of the project.",
            "Created tasks are assigned to you. assigneeEmails assigns other tenant members instead, which only PM, Director and Admin users can do; otherwise the whole call is rejected and nothing is created.",
            "All items are created together or none. Resending the same list returns the already created tasks (isReplay), so retrying after an error never duplicates them.",
            "isReplay: true means the tasks already existed from an earlier call; tell the user. To create the same list again on purpose, pass a new requestKey.",
            "folderID puts every task in a sprint (Laviya folder) of the same project; tasks[].folderID overrides it per item. Sub tasks do not inherit the parent's folder. Get ids with laviya_list_sprints or laviya_create_sprint.",
            "tasks[].links adds up to 10 http(s) links (Figma, Visily, GitHub, any page) to each new task after the tasks are created; not on a replay. A link that fails is listed in tasks[].linkErrors and the task stays created; retry it with laviya_add_task_link."
        ],
        example: {
            name: "laviya_create_tasks",
            arguments: {
                payload: {
                    approvedByUser: true,
                    projectID: 3,
                    tasks: [
                        { referenceID: "W-01", title: "Add export endpoint", description: "Expose CSV export.", priority: 2, complexity: 2, estimatedEffortHours: 4 },
                        { referenceID: "W-02", title: "Cover export endpoint with tests", parentReferenceID: "W-01", taskTypeID: 0 }
                    ]
                }
            }
        }
    },
    {
        name: "laviya_list_sprints",
        purpose: "List the sprints (Laviya folders) of a project with their dates and task counts.",
        notes: ["Read-only. Only folders you can see in projects you can access are returned. search matches part of the folder name."],
        example: {
            name: "laviya_list_sprints",
            arguments: { projectID: 3, search: "Sprint" }
        }
    },
    {
        name: "laviya_create_sprint",
        purpose: "Create a sprint (Laviya folder) with optional start and end dates in a project, after the user approved the sprint plan.",
        notes: [
            "approvedByUser must be true. Dates are YYYY-MM-DD; startDate must not be after endDate.",
            "Idempotent by name: if the project already has an active folder with the same name (case and spaces ignored), it is returned unchanged with isExisting: true; its dates are not changed. If that folder is hidden from you (security guard), the call fails with 403.",
            "Rejected for projects you cannot access and when the tenant's folder limit is reached."
        ],
        example: {
            name: "laviya_create_sprint",
            arguments: { payload: { approvedByUser: true, projectID: 3, name: "Sprint 12", startDate: "2026-11-09", endDate: "2026-11-20" } }
        }
    },
    {
        name: "laviya_assign_tasks_to_sprint",
        purpose: "Add tasks to a sprint (Laviya folder), or remove them from it with remove: true.",
        notes: [
            "approvedByUser must be true. At most 100 taskIDs; every task must be an accessible task of the sprint's project, otherwise nothing is changed.",
            "A task can be in several folders. Each task is reported as added, alreadyPresent, removed or notPresent, so repeating the call is harmless."
        ],
        example: {
            name: "laviya_assign_tasks_to_sprint",
            arguments: { payload: { approvedByUser: true, folderID: 42, taskIDs: [501, 502] } }
        }
    },
    {
        name: "laviya_list_task_links",
        purpose: "List the links of a task (its Links area: Figma, Visily, GitHub and other pages) with id, provider, url, title and preview metadata.",
        notes: ["Read-only. taskID is a numeric ID or a task code (LVY-11262). Use the id as linkID in laviya_remove_task_link."],
        example: {
            name: "laviya_list_task_links",
            arguments: { payload: { taskID: "LVY-11262" } }
        }
    },
    {
        name: "laviya_add_task_link",
        purpose: "Add a Figma frame, Visily board, GitHub or any other http(s) link to a task, so it shows in the task's Links area with a preview.",
        notes: [
            "approvedByUser must be true. A task has at most 50 links. Figma previews need the tenant's Figma add-on and your Figma connection; without them the link is still added.",
            "If the task already has the link, it is returned with isExisting: true, so repeating the call is harmless."
        ],
        example: {
            name: "laviya_add_task_link",
            arguments: { payload: { approvedByUser: true, taskID: 11262, url: "https://www.figma.com/design/AbCdEf1234567890/Checkout?node-id=12-34" } }
        }
    },
    {
        name: "laviya_remove_task_link",
        purpose: "Remove a link from a task.",
        notes: [
            "approvedByUser must be true. linkID must be a link of taskID (see laviya_list_task_links). Only the link's creator, the project PM or an Admin can remove it.",
            "Removing a link that is already removed returns true."
        ],
        example: {
            name: "laviya_remove_task_link",
            arguments: { payload: { approvedByUser: true, taskID: 11262, linkID: 845 } }
        }
    },
    {
        name: "laviya_start_delivery_run",
        purpose: "Group existing Laviya tasks into a delivery run before working on them (outside orchestration), so the work shows on the Delivery runs screen.",
        notes: [
            "Reuses your active run that already contains any of the tasks and adds the missing ones; otherwise creates a run. laviya_create_tasks does not open a run: call this only when you are about to work on the tasks, never when the user only wants tasks created.",
            "Pass the returned id as deliveryRunID to laviya_start_task_work. Each new work session uses one Agent Orchestration credit."
        ],
        example: {
            name: "laviya_start_delivery_run",
            arguments: { payload: { taskIDs: [501, 502], title: "Export improvements" } }
        }
    },
    {
        name: "laviya_start_task_work",
        purpose: "Start the server-measured AI working time on a task right before implementing it (outside orchestration).",
        notes: [
            "The task moves to the project's Processing status. Calling it again returns the open session and keeps the first start time.",
            "Keep the returned sessionID and pass it to laviya_complete_task_work.",
            "Pass deliveryRunID from laviya_start_delivery_run; without it the task's active run is used or a single-task run is created. A new session uses one Agent Orchestration credit."
        ],
        example: {
            name: "laviya_start_task_work",
            arguments: { payload: { taskID: 501 } }
        }
    },
    {
        name: "laviya_complete_task_work",
        purpose: "Finish the work on a task: Laviya records the measured time as AI effort, moves the task to Ready for deploy and adds the completion comment.",
        notes: [
            "Effort is measured by the server from laviya_start_task_work to this call; never send or invent hours.",
            "Call it right after each task is verified, never in a batch at the end. Time shared by tasks worked in parallel is split between them. If you complete late, pass workEndedAt (when the work really ended).",
            "Without targetStatus the project's Ready for deploy status is used (falling back to ToBeVerified, Processed, Completed). targetStatus ignores case, spaces and punctuation.",
            "Safe to retry for the same sessionID, even with a reworded comment or a corrected targetStatus: steps already done are not repeated. Rejected statuses cannot be a target."
        ],
        example: {
            name: "laviya_complete_task_work",
            arguments: {
                payload: {
                    taskID: 501,
                    sessionID: 77,
                    comment: "Added CSV export endpoint with paging; unit tests added and passing."
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