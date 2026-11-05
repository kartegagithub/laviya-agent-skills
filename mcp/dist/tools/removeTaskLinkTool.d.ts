import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface RemoveTaskLinkToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerRemoveTaskLinkTool(deps: RemoveTaskLinkToolDeps): void;
//# sourceMappingURL=removeTaskLinkTool.d.ts.map