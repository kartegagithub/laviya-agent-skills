import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface AssignTasksToProgressPaymentToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerAssignTasksToProgressPaymentTool(deps: AssignTasksToProgressPaymentToolDeps): void;
//# sourceMappingURL=assignTasksToProgressPaymentTool.d.ts.map