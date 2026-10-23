# Laviya Orchestration Contract 1.0

Use this lifecycle only:

1. Get assigned work.
2. Start execution and retain the execution ID.
3. Perform the work within the supplied execution policy.
4. Submit one canonical final output.

Do not write Laviya tasks, comments, wikis, artifacts, statuses, execution fields, or workflow transitions. Do not choose a destination or next step. Laviya validates and routes the result server-side.

Exception outside an assigned run: when the user explicitly approves a work list, `laviya_create_tasks` may create those tasks, `laviya_start_delivery_run` may group already existing tasks of that list, and `laviya_start_task_work` / `laviya_complete_task_work` may track and report the work on them. Never call them during an orchestrated execution. When the user asks, `laviya_upload_task_file`, `laviya_update_task_description` and `laviya_add_task_comment` may add files (screenshots, documents) to a task, and `laviya_assign_task` may assign it (others only with PM permission; otherwise assign yourself).

Submit `contractVersion: "1.0"`, the work item's `ExpectedOutputType`, `agentReportedStatus`, and the output-specific `payload` inside exactly one `<LAVIYA_RESULT>` block. Use the active execution ID returned by start execution. Never invent usage, evidence, tests, or file changes.
