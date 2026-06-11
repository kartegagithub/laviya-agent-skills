import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import {
  idempotentMutationAnnotations,
  toolResultOutputSchema
} from "../mcp/toolMetadata.js";
import { reportTokenUsage, reportTokenUsagePayloadSchema } from "../orchestration/reportTokenUsage.js";
import type { Logger } from "../utils/logger.js";

export interface ReportTokenUsageToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerReportTokenUsageTool(deps: ReportTokenUsageToolDeps): void {
  deps.server.registerTool(
    "laviya_report_token_usage",
    {
      title: "Report Token Usage",
      description:
        "Report measured token usage for the current execution. Runtime blocks empty reports and generates deterministic idempotency key.",
      inputSchema: {
        payload: reportTokenUsagePayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_report_token_usage", deps.logger, async () => {
        const payload = reportTokenUsagePayloadSchema.parse(input.payload);
        return reportTokenUsage(deps.client, deps.logger, payload);
      })
  );
}
