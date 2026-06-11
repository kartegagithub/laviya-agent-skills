import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface GetLocalWorkStatusToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerGetLocalWorkStatusTool(deps: GetLocalWorkStatusToolDeps): void;
//# sourceMappingURL=getLocalWorkStatusTool.d.ts.map