import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Logger } from "../utils/logger.js";
export declare function executeTool(toolName: string, logger: Logger, operation: () => Promise<unknown>, options?: {
    minify?: boolean;
}): Promise<CallToolResult>;
export declare function successToolResult(payload: unknown, minify?: boolean): CallToolResult;
export declare function errorToolResult(error: unknown): CallToolResult;
//# sourceMappingURL=result.d.ts.map