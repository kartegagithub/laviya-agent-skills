import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface StartTaskWorkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerStartTaskWorkTool(deps: StartTaskWorkToolDeps): void;
//# sourceMappingURL=startTaskWorkTool.d.ts.map