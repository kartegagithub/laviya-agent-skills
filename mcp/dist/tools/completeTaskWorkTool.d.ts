import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface CompleteTaskWorkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerCompleteTaskWorkTool(deps: CompleteTaskWorkToolDeps): void;
//# sourceMappingURL=completeTaskWorkTool.d.ts.map