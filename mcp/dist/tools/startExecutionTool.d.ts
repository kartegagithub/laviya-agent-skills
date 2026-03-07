import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";
export interface StartExecutionToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    leaseManager: LeaseManager;
    logger: Logger;
}
export declare function registerStartExecutionTool(deps: StartExecutionToolDeps): void;
//# sourceMappingURL=startExecutionTool.d.ts.map