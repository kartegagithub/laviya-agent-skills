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
    steps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    expectedResult: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    title: string;
    referenceID: string;
    sortOrder?: number | undefined;
    preconditions?: string | undefined;
    steps?: string[] | undefined;
    expectedResult?: string | undefined;
}, {
    title: string;
    referenceID: string;
    sortOrder?: number | undefined;
    preconditions?: string | undefined;
    steps?: string[] | undefined;
    expectedResult?: string | undefined;
}>;
export declare const listTestCasesPayloadSchema: z.ZodObject<{
    taskID: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    taskID: string | number;
}, {
    taskID: string | number;
}>;
export declare const createTestCasesPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    taskID: z.ZodNumber;
    cases: z.ZodArray<z.ZodObject<{
        referenceID: z.ZodString;
        title: z.ZodString;
        preconditions: z.ZodOptional<z.ZodString>;
        steps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        expectedResult: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        title: string;
        referenceID: string;
        sortOrder?: number | undefined;
        preconditions?: string | undefined;
        steps?: string[] | undefined;
        expectedResult?: string | undefined;
    }, {
        title: string;
        referenceID: string;
        sortOrder?: number | undefined;
        preconditions?: string | undefined;
        steps?: string[] | undefined;
        expectedResult?: string | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    approvedByUser: true;
    cases: {
        title: string;
        referenceID: string;
        sortOrder?: number | undefined;
        preconditions?: string | undefined;
        steps?: string[] | undefined;
        expectedResult?: string | undefined;
    }[];
}, {
    taskID: number;
    approvedByUser: true;
    cases: {
        title: string;
        referenceID: string;
        sortOrder?: number | undefined;
        preconditions?: string | undefined;
        steps?: string[] | undefined;
        expectedResult?: string | undefined;
    }[];
}>;
export declare const reportTestResultPayloadSchema: z.ZodObject<{
    filePaths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    fileIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    taskID: z.ZodNumber;
    testCaseID: z.ZodOptional<z.ZodNumber>;
    referenceID: z.ZodOptional<z.ZodString>;
    result: z.ZodEnum<["passed", "failed", "blocked", "skipped"]>;
    evidence: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    taskID: number;
    result: "failed" | "passed" | "skipped" | "blocked";
    referenceID?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
    testCaseID?: number | undefined;
    evidence?: string | undefined;
}, {
    taskID: number;
    result: "failed" | "passed" | "skipped" | "blocked";
    referenceID?: string | undefined;
    filePaths?: string[] | undefined;
    fileIDs?: number[] | undefined;
    testCaseID?: number | undefined;
    evidence?: string | undefined;
}>;
export type ListTestCasesPayload = z.infer<typeof listTestCasesPayloadSchema>;
export type CreateTestCasesPayload = z.infer<typeof createTestCasesPayloadSchema>;
export type ReportTestResultPayload = z.infer<typeof reportTestResultPayloadSchema>;
export declare function listTestCases(client: LaviyaApiClient, logger: Logger, payload: ListTestCasesPayload): Promise<unknown>;
export declare function createTestCases(client: LaviyaApiClient, logger: Logger, payload: CreateTestCasesPayload): Promise<unknown>;
export declare function reportTestResult(client: LaviyaApiClient, logger: Logger, projectRoot: string, payload: ReportTestResultPayload): Promise<unknown>;
//# sourceMappingURL=testCases.d.ts.map