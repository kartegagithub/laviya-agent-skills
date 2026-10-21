import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { createTasks, createTasksPayloadSchema } from "../orchestration/createTasks.js";
import type { Logger } from "../utils/logger.js";

export interface CreateTasksToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  logger: Logger;
}

export function registerCreateTasksTool(deps: CreateTasksToolDeps): void {
  deps.server.registerTool(
    "laviya_create_tasks",
    {
      title: "Create Approved Tasks",
      description:
        "Create Laviya tasks from a work list the user has explicitly approved and return taskID/customTaskID per referenceID. " +
        "Only call after the user approved the exact list; never call it from an orchestrated execution. " +
        "All items are created together or none; resending the same list (same requestKey) returns the already created tasks instead of duplicating them.",
      inputSchema: {
        payload: createTasksPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_create_tasks", deps.logger, async () => {
        const payload = createTasksPayloadSchema.parse(input.payload);
        return createTasks(deps.client, deps.runtimeConfig, deps.logger, payload);
      })
  );
}
