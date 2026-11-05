import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface CreateSprintToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerCreateSprintTool(deps: CreateSprintToolDeps): void;
//# sourceMappingURL=createSprintTool.d.ts.map