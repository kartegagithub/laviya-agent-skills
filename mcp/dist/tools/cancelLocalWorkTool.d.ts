import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";
export interface CancelLocalWorkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    leaseManager: LeaseManager;
    logger: Logger;
}
export declare function registerCancelLocalWorkTool(deps: CancelLocalWorkToolDeps): void;
//# sourceMappingURL=cancelLocalWorkTool.d.ts.map