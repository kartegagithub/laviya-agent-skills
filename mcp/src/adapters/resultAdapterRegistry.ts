import { ClaudeResultAdapter } from "./claudeAdapter.js";
import { CodexResultAdapter } from "./codexAdapter.js";
import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
import type { CanonicalizationResult, ResultAdapter, ResultAdapterContext } from "./resultAdapter.js";

export class ResultAdapterRegistry {
  private readonly adapters: ResultAdapter[] = [
    new ClaudeResultAdapter(),
    new CodexResultAdapter(),
    new GenericMcpResultAdapter()
  ];

  canonicalize(rawOutput: string, context: ResultAdapterContext = {}): CanonicalizationResult {
    const adapter = this.adapters.find((candidate) => candidate.canHandle(context));
    if (!adapter) throw new Error("E_RESULT_ADAPTER_NOT_FOUND: No result adapter accepted the output.");
    return adapter.canonicalize(rawOutput, context);
  }
}

