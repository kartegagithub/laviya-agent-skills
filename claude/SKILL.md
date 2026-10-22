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

## Approved task creation (outside orchestration)

When the user asks to turn a work list into Laviya tasks:

1. Present the exact list (title, description, type, priority, complexity, effort, parent relations) and wait for explicit approval.
2. Call `laviya_create_tasks` with `{ "payload": { "approvedByUser": true, "tasks": [...] } }`. Give each item a unique `referenceID`; nest items with `parentReferenceID` (earlier item) or `parentTaskID` (existing task). `projectID` defaults to the project config.
3. Report the returned `referenceID -> taskID / customTaskID` mapping. All items are created together or none; resending the same list returns the same tasks, so a retry never duplicates them.

Never call `laviya_create_tasks` during an assigned orchestration run or without explicit user approval.

For the full cycle (verify the list, create tasks, write the IDs back, implement each item between `laviya_start_task_work` and `laviya_complete_task_work`, which records the AI effort and moves the task to Ready for deploy) use the `laviya-delivery-cycle` skill.
