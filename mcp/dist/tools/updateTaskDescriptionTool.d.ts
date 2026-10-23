import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface UpdateTaskDescriptionToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
    projectRoot: string;
}
export declare function registerUpdateTaskDescriptionTool(deps: UpdateTaskDescriptionToolDeps): void;
//# sourceMappingURL=updateTaskDescriptionTool.d.ts.map