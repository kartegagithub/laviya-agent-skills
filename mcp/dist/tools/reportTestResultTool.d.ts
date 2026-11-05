import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface ReportTestResultToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
    projectRoot: string;
}
export declare function registerReportTestResultTool(deps: ReportTestResultToolDeps): void;
//# sourceMappingURL=reportTestResultTool.d.ts.map