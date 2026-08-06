import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { executeTool } from "../mcp/result.js";
import {
  idempotentMutationAnnotations,
  toolResultOutputSchema
} from "../mcp/toolMetadata.js";
import { completeExecution, completeExecutionPayloadSchema, prepareCompletion } from "../orchestration/completeExecution.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { ExecutionPolicyManager } from "../orchestration/executionPolicyManager.js";
import type { Logger } from "../utils/logger.js";

export interface CompleteExecutionToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  leaseManager: LeaseManager;
  executionPolicyManager: ExecutionPolicyManager;
  logger: Logger;
}

export function registerCompleteExecutionTool(deps: CompleteExecutionToolDeps): void {
  deps.server.registerTool(
    "laviya_complete_execution",
    {
      title: "Complete Execution",
      description:
        "Submit one final output containing a canonical LAVIYA_RESULT. Laviya validates, evaluates, and routes the result server-side.",
      inputSchema: {
        payload: completeExecutionPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_complete_execution", deps.logger, async () => {
        const payload = completeExecutionPayloadSchema.parse(input.payload);
        const prepared = prepareCompletion(payload);
        if (prepared.canonicalization) {
          deps.executionPolicyManager.validateCompletion(
            payload.aiAgentFlowRunID,
            payload.taskID,
            prepared.canonicalization.canonicalResult.executionEvidence
          );
        }
        const leaseContext = deps.leaseManager.find({
          runId: payload.aiAgentFlowRunID,
          taskId: payload.taskID,
          executionId: payload.aiAgentTaskExecutionID
        });

        if (!leaseContext || leaseContext.executionId !== payload.aiAgentTaskExecutionID) {
          throw new Error("The supplied aiAgentTaskExecutionID does not match an active execution lease.");
        }

        const completionContext = {
          runId: payload.aiAgentFlowRunID,
          taskId: payload.taskID,
          executionId: payload.aiAgentTaskExecutionID
        };
        const paused = deps.leaseManager.pauseForCompletion(completionContext);

        try {
          const result = await completeExecution(deps.client, deps.runtimeConfig, deps.logger, payload, prepared);
          deps.leaseManager.complete(completionContext);
          return result;
        } catch (error: unknown) {
          if (paused) {
            deps.leaseManager.resumeAfterCompletionFailure(completionContext);
          }
          throw error;
        }
      })
  );
}
