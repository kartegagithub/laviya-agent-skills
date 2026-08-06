import type { CanonicalResult } from "../contracts/canonicalResult.js";
export interface ResultAdapterContext {
    agentType?: string;
    agentVersion?: string;
}
export interface CanonicalizationResult {
    canonicalResult: CanonicalResult;
    adapterName: string;
    adapterVersion: string;
    repairs: string[];
}
export interface ResultAdapter {
    readonly name: string;
    readonly version: string;
    canHandle(context: ResultAdapterContext): boolean;
    canonicalize(rawOutput: string, context: ResultAdapterContext): CanonicalizationResult;
}
//# sourceMappingURL=resultAdapter.d.ts.map