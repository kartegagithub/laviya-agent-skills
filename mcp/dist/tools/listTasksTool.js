import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listTasks, listTasksInputSchema } from "../orchestration/listTasks.js";
export function registerListTasksTool(deps) {
    deps.server.registerTool("laviya_list_tasks", {
        title: "List Tasks",
        description: "List Laviya tasks of a project (projectID, or project by name or task prefix) or of every project you can access; by default the open tasks assigned to you, " +
            "highest priority first, 25 per page. Filter by status (open, all or status names), search and task type. Returns items (taskID, customTaskID, title, status, " +
            "priority, complexity, estimatedEffort in minutes, project, parentTaskID, taskTypeID, sprints unless lite), totalCount and hasMore. Read-only. " +
            "To work through tasks the user selects, pass their taskIDs to laviya_start_delivery_run once, then start and complete each task.",
        inputSchema: listTasksInputSchema.shape,
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_list_tasks", deps.logger, async () => {
        const parsed = listTasksInputSchema.parse(input);
        return listTasks(deps.client, deps.logger, parsed);
    }));
}
//# sourceMappingURL=listTasksTool.js.map