import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
export class ClaudeResultAdapter extends GenericMcpResultAdapter {
    name = "claude";
    canHandle(context) {
        return context.agentType?.toLowerCase().includes("claude") ?? false;
    }
}
//# sourceMappingURL=claudeAdapter.js.map