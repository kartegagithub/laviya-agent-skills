import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface AssignTasksToSprintToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerAssignTasksToSprintTool(deps: AssignTasksToSprintToolDeps): void;
//# sourceMappingURL=assignTasksToSprintTool.d.ts.map