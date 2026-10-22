import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface ListProjectsToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerListProjectsTool(deps: ListProjectsToolDeps): void;
//# sourceMappingURL=listProjectsTool.d.ts.map