import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface ReportTokenUsageToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerReportTokenUsageTool(deps: ReportTokenUsageToolDeps): void;
//# sourceMappingURL=reportTokenUsageTool.d.ts.map