import type { CanonicalizationResult, ResultAdapter, ResultAdapterContext } from "./resultAdapter.js";
export declare class GenericMcpResultAdapter implements ResultAdapter {
    readonly name: string;
    readonly version: string;
    canHandle(_context: ResultAdapterContext): boolean;
    canonicalize(rawOutput: string, _context: ResultAdapterContext): CanonicalizationResult;
}
//# sourceMappingURL=genericMcpAdapter.d.ts.map