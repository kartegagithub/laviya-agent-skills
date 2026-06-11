import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { executeTool } from "../mcp/result.js";
import {
  idempotentMutationAnnotations,
  toolResultOutputSchema
} from "../mcp/toolMetadata.js";
import { completeExecution, completeExecutionPayloadSchema } from "../orchestration/completeExecution.js";
import { extractExecutionId } from "../orchestration/executionId.js";
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
        "Complete the active execution with structured summary (executionSummary text or executionSummaryObject JSON), optional generated tasks/wikis, and deterministic idempotency handling.",
      inputSchema: {
        payload: completeExecutionPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_complete_execution", deps.logger, async () => {
        let payload = completeExecutionPayloadSchema.parse(input.payload);
        deps.executionPolicyManager.validateCompletion(
          payload.aiAgentFlowRunID,
          payload.taskID,
          payload.executionEvidence
        );
        const leaseContext = deps.leaseManager.find({
          runId: payload.aiAgentFlowRunID,
          taskId: payload.taskID,
          executionId: payload.aiAgentTaskExecutionID
        });

        if (!payload.aiAgentTaskExecutionID && leaseContext) {
          if (leaseContext.executionId) {
            payload = {
              ...payload,
              aiAgentTaskExecutionID: leaseContext.executionId
            };
            deps.logger.info("Filled aiAgentTaskExecutionID from active lease context.", {
              runId: payload.aiAgentFlowRunID,
              taskId: payload.taskID,
              executionId: leaseContext.executionId
            });
          } else {
            deps.logger.warn("Active lease context does not contain executionId for CompleteExecution.", {
              runId: payload.aiAgentFlowRunID,
              taskId: payload.taskID
            });
          }
        }

        if (!payload.aiAgentTaskExecutionID) {
          deps.logger.info("Resolving aiAgentTaskExecutionID via StartExecution before completion.", {
            runId: payload.aiAgentFlowRunID,
            taskId: payload.taskID
          });

          const startExecutionResult = await deps.client.startExecution({
            runId: payload.aiAgentFlowRunID,
            taskId: payload.taskID
          });
          const resolvedExecutionId = extractExecutionId(startExecutionResult);

          if (!resolvedExecutionId) {
            throw new Error("Unable to resolve aiAgentTaskExecutionID from StartExecution response.");
          }

          payload = {
            ...payload,
            aiAgentTaskExecutionID: resolvedExecutionId
          };

          deps.logger.info("Resolved aiAgentTaskExecutionID via StartExecution.", {
            runId: payload.aiAgentFlowRunID,
            taskId: payload.taskID,
            executionId: resolvedExecutionId
          });
        }

        const completionContext = {
          runId: payload.aiAgentFlowRunID,
          taskId: payload.taskID,
          executionId: payload.aiAgentTaskExecutionID
        };
        const paused = deps.leaseManager.pauseForCompletion(completionContext);

        try {
          const result = await completeExecution(deps.client, deps.runtimeConfig, deps.logger, payload);
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
