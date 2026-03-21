import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface AddTaskCommentToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerAddTaskCommentTool(deps: AddTaskCommentToolDeps): void;
//# sourceMappingURL=addTaskCommentTool.d.ts.map