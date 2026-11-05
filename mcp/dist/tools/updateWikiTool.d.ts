import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface UpdateWikiToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerUpdateWikiTool(deps: UpdateWikiToolDeps): void;
//# sourceMappingURL=updateWikiTool.d.ts.map