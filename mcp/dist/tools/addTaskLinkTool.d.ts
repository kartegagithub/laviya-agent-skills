import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface AddTaskLinkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerAddTaskLinkTool(deps: AddTaskLinkToolDeps): void;
//# sourceMappingURL=addTaskLinkTool.d.ts.map