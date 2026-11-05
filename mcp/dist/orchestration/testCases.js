import { z } from "zod";
import { readData } from "./createTasks.js";
import { fileListSchema, MAX_FILES_PER_CALL, readTaskFile, resolveTaskFileIDs } from "./taskContent.js";
export const MAX_TEST_CASES_PER_CALL = 50;
export const MAX_TEST_STEPS = 50;
export const MAX_TEST_TEXT_LENGTH = 10_000;
const testTextSchema = z.string().max(MAX_TEST_TEXT_LENGTH);
export const testCaseInputSchema = z.object({
    referenceID: z.string().trim().min(1).max(100)
        .describe("Your stable key for the case (e.g. \"TC-1\" or the PRD scenario number). Saving the same referenceID again updates that case instead of adding another."),
    title: z.string().trim().min(1).max(500),
    preconditions: testTextSchema.optional().describe("Plain text."),
    steps: z.array(z.string().trim().min(1).max(1000)).max(MAX_TEST_STEPS)
        .refine((steps) => steps.join("\n").length <= MAX_TEST_TEXT_LENGTH, `Steps must be at most ${MAX_TEST_TEXT_LENGTH} characters in total.`)
        .optional().describe("Steps in order (stored one per line)."),
    expectedResult: testTextSchema.optional().describe("Plain text."),
    sortOrder: z.number().int().optional().describe("Order in the task's list. Default: after the existing cases (unchanged on update).")
}).strict();
export const listTestCasesPayloadSchema = z.object({
    taskID: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)])
        .describe("Numeric task ID or task code (e.g. 11262 or \"LVY-11262\").")
}).strict();
export const createTestCasesPayloadSchema = z.object({
    approvedByUser: z.literal(true),
    taskID: z.number().int().positive(),
    cases: z.array(testCaseInputSchema).min(1).max(MAX_TEST_CASES_PER_CALL)
        .describe("1-50 cases; each referenceID once. Cases with a referenceID already on the task are updated, the others are added.")
}).strict();
export const reportTestResultPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    testCaseID: z.number().int().positive().optional().describe("Test case id from laviya_list_test_cases or laviya_create_test_cases."),
    referenceID: z.string().trim().min(1).max(100).optional().describe("referenceID of the case instead of testCaseID."),
    result: z.enum(["passed", "failed", "blocked", "skipped"]),
    evidence: testTextSchema.optional().describe("Plain text: what was run and what was observed (commands, output, URLs)."),
    ...fileListSchema.shape
}).strict();
export async function listTestCases(client, logger, payload) {
    logger.info("Listing Laviya test cases", { taskID: payload.taskID });
    return readData(await client.getTaskTestCases(String(payload.taskID)));
}
export async function createTestCases(client, logger, payload) {
    logger.info("Saving Laviya test cases", { taskID: payload.taskID, caseCount: payload.cases.length });
    return readData(await client.saveTaskTestCases({
        taskID: payload.taskID,
        cases: payload.cases.map((testCase) => ({
            referenceID: testCase.referenceID,
            title: testCase.title,
            preconditions: testCase.preconditions,
            steps: testCase.steps?.join("\n"),
            expectedResult: testCase.expectedResult,
            sortOrder: testCase.sortOrder
        }))
    }));
}
export async function reportTestResult(client, logger, projectRoot, payload) {
    if ((payload.testCaseID === undefined) === (payload.referenceID === undefined)) {
        throw new Error("Pass exactly one of testCaseID or referenceID.");
    }
    if ((payload.filePaths?.length ?? 0) + (payload.fileIDs?.length ?? 0) > MAX_FILES_PER_CALL) {
        throw new Error(`At most ${MAX_FILES_PER_CALL} evidence files (filePaths + fileIDs) can be reported in one call.`);
    }
    // Files are validated locally before anything is uploaded, so a bad path does not leave half the files behind.
    for (const filePath of payload.filePaths ?? []) {
        await readTaskFile(projectRoot, filePath);
    }
    const fileIDs = await resolveTaskFileIDs(client, logger, projectRoot, payload.taskID, payload);
    logger.info("Reporting a Laviya test result", { taskID: payload.taskID, result: payload.result, fileCount: fileIDs.length });
    return readData(await client.addTaskTestRun({
        taskID: payload.taskID,
        taskTestCaseID: payload.testCaseID,
        referenceID: payload.referenceID,
        result: payload.result,
        evidence: payload.evidence,
        evidenceFileIDs: fileIDs.length > 0 ? fileIDs : undefined
    }));
}
//# sourceMappingURL=testCases.js.map