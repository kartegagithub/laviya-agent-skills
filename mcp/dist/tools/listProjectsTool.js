import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listProjects, listProjectsInputSchema } from "../orchestration/listProjects.js";
export function registerListProjectsTool(deps) {
    deps.server.registerTool("laviya_list_projects", {
        title: "List Projects",
        description: "List the Laviya projects the api key owner can access (ID, Name, TaskPrefix, SpaceName), optionally filtered by name or task prefix. " +
            "Use it to let the user choose by name which project laviya_create_tasks should create tasks in.",
        inputSchema: {
            search: listProjectsInputSchema.shape.search
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_list_projects", deps.logger, async () => {
        const parsed = listProjectsInputSchema.parse(input);
        return listProjects(deps.client, deps.logger, parsed);
    }));
}
//# sourceMappingURL=listProjectsTool.js.map