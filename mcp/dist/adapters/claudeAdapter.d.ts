import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
import type { ResultAdapterContext } from "./resultAdapter.js";
export declare class ClaudeResultAdapter extends GenericMcpResultAdapter {
    readonly name = "claude";
    canHandle(context: ResultAdapterContext): boolean;
}
//# sourceMappingURL=claudeAdapter.d.ts.map