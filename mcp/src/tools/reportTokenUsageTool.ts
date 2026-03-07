import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
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
      }
    },
    async (input) => {
      try {
        const payload = reportTokenUsagePayloadSchema.parse(input.payload);
        const result = await reportTokenUsage(deps.client, deps.logger, payload);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_report_token_usage failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
