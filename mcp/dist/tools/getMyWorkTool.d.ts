import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { ExecutionPolicyManager } from "../orchestration/executionPolicyManager.js";
import type { Logger } from "../utils/logger.js";
export interface GetMyWorkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    runtimeConfig: RuntimeConfig;
    executionPolicyManager: ExecutionPolicyManager;
    logger: Logger;
}
export declare function registerGetMyWorkTool(deps: GetMyWorkToolDeps): void;
//# sourceMappingURL=getMyWorkTool.d.ts.map