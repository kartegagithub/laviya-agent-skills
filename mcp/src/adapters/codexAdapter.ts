import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
import type { ResultAdapterContext } from "./resultAdapter.js";

export class CodexResultAdapter extends GenericMcpResultAdapter {
  override readonly name = "codex";
  override canHandle(context: ResultAdapterContext): boolean {
    return context.agentType?.toLowerCase().includes("codex") ?? false;
  }
}

