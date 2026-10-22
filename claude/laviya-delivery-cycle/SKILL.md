---
name: laviya-delivery-cycle
description: Run a work list (artifact, Markdown file or pasted plan) end to end with Laviya - verify what is done and what is left against the codebase, create Laviya tasks for the to-do items the user approves, write each Laviya task ID next to its item, then implement the items one by one while Laviya measures the AI working time, and move each finished task to Ready for deploy with a completion comment. Use when the user asks to verify a plan, open Laviya tasks for it, or work through it with Laviya tracking.
---

# Laviya Delivery Cycle

This cycle is user-driven and runs outside Laviya orchestration. Do not call `laviya_get_my_work`, `laviya_start_execution` or `laviya_complete_execution` here.

Laviya tools used:

- `laviya_diagnostics`: confirm the MCP runtime and API host.
- `laviya_list_projects`: list the Laviya projects the user can access, so they can choose where the tasks go.
- `laviya_create_tasks`: create the approved to-do items; returns `tasks[]` with `referenceID`, `taskID` and `customTaskID`.
- `laviya_start_task_work`: start the server-measured AI working time on a task (the task moves to the project's Processing status); returns `sessionID`, `customTaskID` and, when the task has Figma or Visily links, `designReferences`.
- `laviya_complete_task_work`: record the measured time as AI effort, move the task to Ready for deploy and add the completion comment.

Everything is written on behalf of the api key owner and carries Laviya's AI marker. Talk to the user in their language; write Laviya titles, descriptions and comments in the language of the work list.

## The work list is the source of truth

- The work list is an artifact (claude.ai artifact link), a Markdown file in the repo, or text the user pasted. If it was pasted, save it as a Markdown file first (ask where) so Laviya IDs can be written back.
- Every item gets a stable key (`W-01`, `W-02`, ...) used as `referenceID`.
- After tasks are created, write the Laviya ID on the item line, for example:
  `- [ ] W-03 Add export endpoint - Laviya: LVY-1234 (#1234) - To do`
- Update the state on the same line as the cycle progresses: `To do` -> `In progress` -> `Ready for deploy`.
- An item that already carries a Laviya ID is never sent to `laviya_create_tasks` again.
- Update a claude.ai artifact by reading it and republishing the same artifact; edit a local file in place.

## 1. Preflight

1. Call `laviya_diagnostics`. Stop and tell the user if the MCP runtime is not reachable.
2. Load the work list and assign item keys if missing.
3. Ask the user which Laviya project the tasks belong to. Call `laviya_list_projects` (with `search` when the user names a project) and let the user pick by name; never assume a project from configuration or an earlier list. Every work list can target a different project.

## 2. Verify done and to-do items (read-only)

For every item, inspect the codebase (code, tests, configuration, git history) and classify it:

- `Done`: implemented and verifiable. Give file:line or commit evidence.
- `Partial`: started but incomplete. State exactly what is missing; the missing part becomes the to-do.
- `To do`: not started.

Present the chosen project (name and task prefix) and one table: key, item, state, evidence, and for each `To do` / `Partial` item the proposed Laviya task: title, short description, type, priority, complexity, estimated effort in hours and parent item. Show names, not numbers:

- type (`taskTypeID`): Task 0, Bug 10, ChangeRequest 20, Improvement 30, Debt 40, Suggestion 50, Meeting 60, Story 70, Epic 80
- priority: NoPriority 0, Low 1, Medium 2, High 3
- complexity: Easy 0, Normal 1, Hard 2, Expert 3

Do not write anything to Laviya or the code in this step.

## 3. Approval

Ask the user to approve the proposed task list and the target project. They may remove, add or edit items or change the project. Continue only after explicit approval of the exact list; approval covers only the items in that list.

## 4. Create Laviya tasks

1. Call `laviya_create_tasks` once with `{ "payload": { "approvedByUser": true, "projectID": <chosen project ID>, "tasks": [...] } }`.
   - `referenceID` = item key. Put parents before children; use `parentReferenceID` for children and `parentTaskID` for a parent that already exists in Laviya.
   - Send `estimatedEffortHours`; descriptions are plain text.
2. All items are created together or none. If the call fails, fix the cause shown in the error (for example a status or progress payment requirement) and call again; resending the same list never creates duplicates, it returns the tasks that already exist (`isReplay: true`). When `isReplay` is true on the first call for this list, tell the user these tasks already existed; to create the same list again on purpose, pass a new `requestKey`.
3. Write every returned `taskID` / `customTaskID` into the work list right away and show the user the key -> Laviya ID table.

## 5. Work through the items

Take the to-do items one at a time, in order (children before closing their parent):

1. Call `laviya_start_task_work` with `{ "payload": { "taskID": <id> } }` right before starting the item and keep the returned `sessionID`. Mark the item `In progress` in the work list.
   - When the item needs a branch, commit or pull request, name the branch `<type>/<customTaskID>-<short-slug>` (for example `feature/LVY-1234-export-endpoint`) and start every commit message and PR title with the `customTaskID` (`LVY-1234 - Add export endpoint`). Use `TASK-<taskID>` when `customTaskID` is empty. The Laviya GitHub integration then links them to the task automatically. Commit, push or open a PR only when the repository workflow or the user asks for it.
2. Implement the item following the repository conventions.
   - Before implementing, read every entry in `designReferences` returned by `laviya_start_task_work` and any Figma or Visily URL in the work-list item: Figma through the Figma MCP server (`figmaFileKey` / `figmaNodeID` when the tool asks for them), Visily through its `embedUrl` with a Visily or browser MCP server. If no suitable MCP server is available, tell the user and continue from the link title and the item description; never invent design details.
3. Verify it: build, tests, or the checks the repository uses. Never claim a check that was not run.
4. When the item is complete and verified, call `laviya_complete_task_work` with `{ "payload": { "taskID": <id>, "sessionID": <sessionID>, "comment": "<completion note>" } }`.
   - The comment says what changed, the main files, how it was verified (with results), and anything left for deploy or review.
   - Laviya measures the time between start and complete and records it as AI effort; never send or estimate hours yourself.
   - The task moves to the project's Ready for deploy status. Pass `targetStatus` only when the user names another status, and tell the user if the returned `targetStatus.name` is not Ready for deploy.
   - If the call fails, call it again with the same `taskID` and `sessionID` (the comment or `targetStatus` may be corrected): steps that are already done are not repeated.
5. Mark the item `Ready for deploy` in the work list and give the user a one-line progress update.
6. If an item cannot be completed (blocked, failing verification, needs a decision), do not call `laviya_complete_task_work`. Explain the blocker and continue with the next independent item only if the user agrees; the open work session resumes when you start the item again.

## 6. Finish

When every approved item is handled, give a final table: key, item, Laviya ID, final state, measured effort, verification. The work list must show the same information.
