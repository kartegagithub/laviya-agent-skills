import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface UpdateTaskTagsToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerUpdateTaskTagsTool(deps: UpdateTaskTagsToolDeps): void;
//# sourceMappingURL=updateTaskTagsTool.d.ts.map