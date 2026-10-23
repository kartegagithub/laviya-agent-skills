import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface UploadTaskFileToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
    projectRoot: string;
}
export declare function registerUploadTaskFileTool(deps: UploadTaskFileToolDeps): void;
//# sourceMappingURL=uploadTaskFileTool.d.ts.map