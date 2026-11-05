import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { reportTestResult, reportTestResultPayloadSchema } from "../orchestration/testCases.js";
import type { Logger } from "../utils/logger.js";

export interface ReportTestResultToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
  projectRoot: string;
}

export function registerReportTestResultTool(deps: ReportTestResultToolDeps): void {
  deps.server.registerTool(
    "laviya_report_test_result",
    {
      title: "Report Test Result",
      description:
        "Record a run of a task's test case (by testCaseID or referenceID): passed, failed, blocked or skipped, with plain-text evidence and evidence files. " +
        "Local filePaths are uploaded to the task attachments first. Every call adds a run and is never retried automatically, so do not repeat a call that succeeded.",
      inputSchema: {
        payload: reportTestResultPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: mutatingToolAnnotations
    },
    async (input) =>
      executeTool("laviya_report_test_result", deps.logger, async () => {
        const payload = reportTestResultPayloadSchema.parse(input.payload);
        return reportTestResult(deps.client, deps.logger, deps.projectRoot, payload);
      })
  );
}
