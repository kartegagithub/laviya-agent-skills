import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface FeedTaskToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerFeedTaskTool(deps: FeedTaskToolDeps): void;
//# sourceMappingURL=feedTaskTool.d.ts.map