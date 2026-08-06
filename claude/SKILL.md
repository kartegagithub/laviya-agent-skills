---
name: laviya-orchestration
description: Execute assigned Laviya work and submit one canonical final result.
---

# Laviya Orchestration

1. Retrieve work with `laviya_get_my_work`.
2. Start it with `laviya_start_execution` and retain the returned execution ID.
3. Follow the supplied execution policy.
4. Submit once through `laviya_complete_execution` using `taskID`, `aiAgentFlowRunID`, `aiAgentTaskExecutionID`, and `finalOutput`.

The final output must contain exactly one canonical contract `1.0` result matching the work item's `ExpectedOutputType`. Do not choose or update tasks, comments, wikis, artifacts, execution status, or the next workflow step. Do not invent token usage or evidence.
