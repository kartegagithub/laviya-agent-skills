import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { updateWiki, updateWikiPayloadSchema } from "../orchestration/wikis.js";
export function registerUpdateWikiTool(deps) {
    deps.server.registerTool("laviya_update_wiki", {
        title: "Update Wiki",
        description: "Rename a Laviya wiki and/or replace (default) or append its Markdown content, after the user approved the change. " +
            "Only wikis you can see in Laviya can be updated. Replace overwrites the whole content; append is not retried automatically.",
        inputSchema: {
            payload: updateWikiPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: mutatingToolAnnotations
    }, async (input) => executeTool("laviya_update_wiki", deps.logger, async () => {
        const payload = updateWikiPayloadSchema.parse(input.payload);
        return updateWiki(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=updateWikiTool.js.map