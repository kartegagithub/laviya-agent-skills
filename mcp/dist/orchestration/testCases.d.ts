import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_TEST_CASES_PER_CALL = 50;
export declare const MAX_TEST_STEPS = 50;
export declare const MAX_TEST_TEXT_LENGTH = 10000;
export declare const testCaseInputSchema: z.ZodObject<{
    referenceID: z.ZodString;
    title: z.ZodString;
    preconditions: z.ZodOptional<z.ZodString>;
    steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    expectedResult: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const listTestCasesPayloadSchema: z.ZodObject<{
    taskID: z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>;
}, z.core.$strict>;
export declare const createTestCasesPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    taskID: z.ZodNumber;
    cases: z.ZodArray<z.ZodObject<{
        referenceID: z.ZodString;
        title: z.ZodString;
        preconditions: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString>>;
        expectedResult: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const reportTestResultPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    taskID: z.ZodNumber;
    testCaseID: z.ZodOptional<z.ZodNumber>;
    referenceID: z.ZodOptional<z.ZodString>;
    result: z.ZodEnum<{
        failed: "failed";
        passed: "passed";
        skipped: "skipped";
        blocked: "blocked";
    }>;
    evidence: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ListTestCasesPayload = z.infer<typeof listTestCasesPayloadSchema>;
export type CreateTestCasesPayload = z.infer<typeof createTestCasesPayloadSchema>;
export type ReportTestResultPayload = z.infer<typeof reportTestResultPayloadSchema>;
export declare function listTestCases(client: LaviyaApiClient, logger: Logger, payload: ListTestCasesPayload): Promise<unknown>;
export declare function createTestCases(client: LaviyaApiClient, logger: Logger, payload: CreateTestCasesPayload): Promise<unknown>;
export declare function reportTestResult(client: LaviyaApiClient, logger: Logger, projectRoot: string, payload: ReportTestResultPayload): Promise<unknown>;
//# sourceMappingURL=testCases.d.ts.map