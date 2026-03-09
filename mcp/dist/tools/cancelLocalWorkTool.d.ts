import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface CancelLocalWorkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerCancelLocalWorkTool(deps: CancelLocalWorkToolDeps): void;
//# sourceMappingURL=cancelLocalWorkTool.d.ts.map