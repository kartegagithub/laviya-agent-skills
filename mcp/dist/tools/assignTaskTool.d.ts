import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface AssignTaskToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerAssignTaskTool(deps: AssignTaskToolDeps): void;
//# sourceMappingURL=assignTaskTool.d.ts.map