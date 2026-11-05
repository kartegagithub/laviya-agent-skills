import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface CreateWikiToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerCreateWikiTool(deps: CreateWikiToolDeps): void;
//# sourceMappingURL=createWikiTool.d.ts.map