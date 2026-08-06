import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
export class CodexResultAdapter extends GenericMcpResultAdapter {
    name = "codex";
    canHandle(context) {
        return context.agentType?.toLowerCase().includes("codex") ?? false;
    }
}
//# sourceMappingURL=codexAdapter.js.map