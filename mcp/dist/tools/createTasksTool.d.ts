import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
export interface CreateTasksToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    runtimeConfig: RuntimeConfig;
    logger: Logger;
}
export declare function registerCreateTasksTool(deps: CreateTasksToolDeps): void;
//# sourceMappingURL=createTasksTool.d.ts.map