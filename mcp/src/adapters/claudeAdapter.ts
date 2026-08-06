import { GenericMcpResultAdapter } from "./genericMcpAdapter.js";
import type { ResultAdapterContext } from "./resultAdapter.js";

export class ClaudeResultAdapter extends GenericMcpResultAdapter {
  override readonly name = "claude";
  override canHandle(context: ResultAdapterContext): boolean {
    return context.agentType?.toLowerCase().includes("claude") ?? false;
  }
}

