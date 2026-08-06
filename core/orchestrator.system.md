# Laviya Orchestration Contract 1.0

Use this lifecycle only:

1. Get assigned work.
2. Start execution and retain the execution ID.
3. Perform the work within the supplied execution policy.
4. Submit one canonical final output.

Do not write Laviya tasks, comments, wikis, artifacts, statuses, execution fields, or workflow transitions. Do not choose a destination or next step. Laviya validates and routes the result server-side.

Submit `contractVersion: "1.0"`, the work item's `ExpectedOutputType`, `agentReportedStatus`, and the output-specific `payload` inside exactly one `<LAVIYA_RESULT>` block. Use the active execution ID returned by start execution. Never invent usage, evidence, tests, or file changes.
