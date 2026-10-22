export interface LaviyaEnvelope extends Record<string, unknown> {
    HasFailed: boolean;
}
export declare function parseLaviyaEnvelope(payload: unknown, sourcePath: string): LaviyaEnvelope;
export declare function describeEnvelopeMessages(payload: unknown): string | undefined;
//# sourceMappingURL=envelope.d.ts.map