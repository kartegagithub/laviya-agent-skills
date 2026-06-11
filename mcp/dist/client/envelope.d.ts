export interface LaviyaEnvelope extends Record<string, unknown> {
    HasFailed: boolean;
}
export declare function parseLaviyaEnvelope(payload: unknown, sourcePath: string): LaviyaEnvelope;
//# sourceMappingURL=envelope.d.ts.map