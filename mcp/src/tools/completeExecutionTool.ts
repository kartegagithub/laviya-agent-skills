import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { completeExecution, completeExecutionPayloadSchema } from "../orchestration/completeExecution.js";
import { extractExecutionId } from "../orchestration/executionId.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";

export interface CompleteExecutionToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  leaseManager: LeaseManager;
  logger: Logger;
}

export function registerCompleteExecutionTool(deps: CompleteExecutionToolDeps): void {
  deps.server.registerTool(
    "laviya_complete_execution",
    {
      title: "Complete Execution",
      description:
        "Complete the active execution with structured summary, optional generated tasks/wikis, and deterministic idempotency handling.",
      inputSchema: {
        payload: completeExecutionPayloadSchema
      }
    },
    async (input) => {
      try {
        let payload = completeExecutionPayloadSchema.parse(input.payload);
        const leaseContext = deps.leaseManager.getActiveContext();

        if (!payload.aiAgentTaskExecutionID && leaseContext) {
          const sameWorkItem =
            leaseContext.runId === payload.aiAgentFlowRunID && leaseContext.taskId === payload.taskID;

          if (sameWorkItem && leaseContext.executionId) {
            payload = {
              ...payload,
              aiAgentTaskExecutionID: leaseContext.executionId
            };
            deps.logger.info("Filled aiAgentTaskExecutionID from active lease context.", {
              runId: payload.aiAgentFlowRunID,
              taskId: payload.taskID,
              executionId: leaseContext.executionId
            });
          } else if (!sameWorkItem) {
            deps.logger.warn("CompleteExecution payload does not match active lease context.", {
              payloadRunId: payload.aiAgentFlowRunID,
              payloadTaskId: payload.taskID,
              activeRunId: leaseContext.runId,
              activeTaskId: leaseContext.taskId
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

        // Stop lease refresh before completion to avoid concurrent StartExecution calls
        // while CompleteExecution is in-flight.
        deps.leaseManager.stop();
        const result = await completeExecution(deps.client, deps.runtimeConfig, deps.logger, payload);

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_complete_execution failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
