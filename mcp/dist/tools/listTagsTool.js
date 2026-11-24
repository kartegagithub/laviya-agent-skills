import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listTags, listTagsInputSchema } from "../orchestration/taskTags.js";
export function registerListTagsTool(deps) {
    deps.server.registerTool("laviya_list_tags", {
        title: "List Tags",
        description: "List the active tags of your Laviya tenant (id, name, colorCode), optionally filtered by part of the name. Tags are shared by all projects. Read-only.",
        inputSchema: {
            search: listTagsInputSchema.shape.search
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_list_tags", deps.logger, async () => {
        const parsed = listTagsInputSchema.parse(input);
        return listTags(deps.client, deps.logger, parsed);
    }));
}
//# sourceMappingURL=listTagsTool.js.map