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

## Design references

`Data.DesignReferences` lists the Figma and Visily links attached to the task (`Provider`, `LinkType`, `Url`, `EmbedUrl`, `Title`, `FigmaFileKey`, `FigmaNodeID`). When it is non-empty, read every reference before implementing or analyzing:

- Figma: read the file or node through the Figma MCP server (use `FigmaFileKey` and `FigmaNodeID` when the tool asks for them).
- Visily: open `EmbedUrl` (or `Url`) through a Visily or browser MCP server.
- If no suitable MCP server is available, say so in the result and continue from the link titles, the task description and `UserRequest`.

Never invent design details that you could not read. Reading design references is allowed under every `ExecutionPolicy`.

## Branch and PR naming

Only when `ExecutionPolicy.workspaceWriteAllowed` is true and the step creates branches, commits or pull requests:

- Branch: `<type>/<CustomTaskID>-<short-slug>`, for example `feature/LVY-1234-export-endpoint` (`type` is `feature`, `fix`, `chore`, ...; slug is lowercase kebab-case ASCII).
- Commit messages and pull request titles start with the key: `LVY-1234 - Add export endpoint`.
- The key is `Data.CustomTaskID`; when it is empty use `TASK-<TaskID>`. Keep its exact spelling.

The Laviya GitHub integration finds the key in branch names, commit messages and PR titles and links them to the task automatically.

## Approved task creation (outside orchestration)

When the user asks to turn a work list into Laviya tasks:

1. Present the exact list (title, description, type, priority, complexity, effort, parent relations) and wait for explicit approval.
2. Call `laviya_create_tasks` with `{ "payload": { "approvedByUser": true, "tasks": [...] } }`. Give each item a unique `referenceID`; nest items with `parentReferenceID` (earlier item) or `parentTaskID` (existing task). `projectID` defaults to the project config.
3. Report the returned `referenceID -> taskID / customTaskID` mapping. All items are created together or none; resending the same list returns the same tasks, so a retry never duplicates them.

Never call `laviya_create_tasks` during an assigned orchestration run or without explicit user approval.

For the full cycle (verify the list, create tasks, write the IDs back, implement each item between `laviya_start_task_work` and `laviya_complete_task_work`, which records the AI effort and moves the task to Ready for deploy) use the `laviya-delivery-cycle` skill.
