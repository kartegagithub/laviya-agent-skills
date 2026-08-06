import { ClaudeResultAdapter } from "./claudeAdapter.js";
import { CodexResultAdapter } from "./codexAdapter.js";
import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
export class ResultAdapterRegistry {
    adapters = [
        new ClaudeResultAdapter(),
        new CodexResultAdapter(),
        new GenericMcpResultAdapter()
    ];
    canonicalize(rawOutput, context = {}) {
        const adapter = this.adapters.find((candidate) => candidate.canHandle(context));
        if (!adapter)
            throw new Error("E_RESULT_ADAPTER_NOT_FOUND: No result adapter accepted the output.");
        return adapter.canonicalize(rawOutput, context);
    }
}
//# sourceMappingURL=resultAdapterRegistry.js.map