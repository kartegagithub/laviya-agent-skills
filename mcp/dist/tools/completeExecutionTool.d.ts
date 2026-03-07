import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";
export interface CompleteExecutionToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    runtimeConfig: RuntimeConfig;
    leaseManager: LeaseManager;
    logger: Logger;
}
export declare function registerCompleteExecutionTool(deps: CompleteExecutionToolDeps): void;
//# sourceMappingURL=completeExecutionTool.d.ts.map