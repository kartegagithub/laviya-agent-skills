import { reportTokenUsage, reportTokenUsagePayloadSchema } from "../orchestration/reportTokenUsage.js";
export function registerReportTokenUsageTool(deps) {
    deps.server.registerTool("laviya_report_token_usage", {
        title: "Report Token Usage",
        description: "Report measured token usage for the current execution. Runtime blocks empty reports and generates deterministic idempotency key.",
        inputSchema: {
            payload: reportTokenUsagePayloadSchema
        }
    }, async (input) => {
        try {
            const payload = reportTokenUsagePayloadSchema.parse(input.payload);
            const result = await reportTokenUsage(deps.client, deps.logger, payload);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            deps.logger.error("laviya_report_token_usage failed", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    });
}
//# sourceMappingURL=reportTokenUsageTool.js.map