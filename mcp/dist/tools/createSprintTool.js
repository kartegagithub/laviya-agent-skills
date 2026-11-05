import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { createSprint, createSprintPayloadSchema } from "../orchestration/sprints.js";
export function registerCreateSprintTool(deps) {
    deps.server.registerTool("laviya_create_sprint", {
        title: "Create Sprint",
        description: "Create a sprint (Laviya folder) with optional start and end dates in a project you can access, after the user approved it. " +
            "If the project already has an active folder with the same name (case and spaces ignored), that folder is returned unchanged with isExisting: true, " +
            "so sending the same sprint plan again never duplicates folders.",
        inputSchema: {
            payload: createSprintPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_create_sprint", deps.logger, async () => {
        const payload = createSprintPayloadSchema.parse(input.payload);
        return createSprint(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=createSprintTool.js.map