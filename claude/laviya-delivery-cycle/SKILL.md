---
name: laviya-delivery-cycle
description: Run a work list (artifact, Markdown file or pasted plan) end to end with Laviya - verify what is done and what is left against the codebase, create Laviya tasks for the to-do items the user approves, write each Laviya task ID next to its item, then implement the items one by one while Laviya measures the AI working time, and move each finished task to Ready for deploy with a completion comment. Also lists the Laviya tasks assigned to the user (per project, open by default) and works through the ones they select. Use when the user asks to verify a plan, open Laviya tasks for it, or work through it with Laviya tracking, or asks to list their Laviya tasks, see what is assigned to them or pending in a project, or do their assigned tasks, or asks to test the tasks waiting in a test status and close or send them back with their approval.
---

# Laviya Delivery Cycle

This cycle is user-driven and runs outside Laviya orchestration. Do not call `laviya_get_my_work`, `laviya_start_execution` or `laviya_complete_execution` here.

Laviya tools used:

- `laviya_diagnostics`: confirm the MCP runtime and API host.
- `laviya_list_projects`: list the Laviya projects the user can access, so they can choose where the tasks go.
- `laviya_create_tasks`: create the approved to-do items; returns `tasks[]` with `referenceID`, `taskID` and `customTaskID`. Creating tasks never opens a delivery run.
- `laviya_list_tasks`: list tasks of a project (`projectID`, or `project` by name or task prefix) or of all your projects; by default the open tasks assigned to you, highest priority first, 25 per page (`page`, `pageSize` up to 100, `hasMore`). Filter with `status` (`open`, `all` or status names), `search`, `taskTypeIDs`, `assignedTo: "anyone"`; `lite: true` leaves sprints out. Read-only.
- `laviya_get_task`: read a task by ID or code (`LVY-11262`): description, status, people, attachments, sub tasks and latest comments. Read-only. Use it when the user only gives task codes; pass `downloadAttachments: "images"` when the description has screenshots and open the returned `localPath` files.
- `laviya_upload_task_file`, `laviya_update_task_description`: add screenshots, documents or other files to a task's attachments, description or (with `laviya_add_task_comment` / the completion) comments.
- `laviya_assign_task`: assign a task; without e-mails it is assigned to you. Only users with PM permission (PM, Director, Admin) can assign other people.
- `laviya_list_sprints`, `laviya_create_sprint`, `laviya_assign_tasks_to_sprint`: list, create (idempotent by name) and fill sprints, which are Laviya folders. Create or assign only what the user approved; `laviya_create_tasks` also takes `folderID` (for all items or per item) to put new tasks in a sprint.
- `laviya_list_task_links`, `laviya_add_task_link`, `laviya_remove_task_link`: list, add (idempotent) and remove a task's links (Figma frame, Visily board, GitHub, any page); they show in the task's Links area with a preview. Add or remove only what the user approved; `laviya_create_tasks` also takes `tasks[].links` (max 10) and reports failed links in `tasks[].linkErrors` without undoing the task.
- `laviya_list_test_cases`, `laviya_create_test_cases`, `laviya_report_test_result`: list, create (idempotent by `referenceID`) and record runs of a task's test cases (title, preconditions, steps, expected result); they show in the task's Test cases area with the latest result. Create only the cases the user approved (for example the test scenarios of a PRD, on the story or task they belong to); report a result with evidence (what was run and observed, `filePaths` for screenshots or logs) after verifying the task. Reporting is never retried, so do not repeat a call that succeeded.
- `laviya_list_wikis`, `laviya_get_wiki`, `laviya_create_wiki`, `laviya_update_wiki`: list (by `projectID` or `project` name/prefix), read, create (idempotent by name under the same parent; `parentWikiID` for a sub wiki, `relatedTaskIDs` to mention tasks) and update (rename, `mode` replace or append) project wikis you can see. Write technical documents to the wiki only when the user asks for it, and create or update only what the user approved.
- `laviya_start_delivery_run`: group tasks that already existed in Laviya into a delivery run (reuses your active run that contains them); returns the run `id`.
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
   - Tasks are assigned to you. Pass `assigneeEmails` only when the user names other assignees; this needs PM permission or higher, otherwise the call is rejected and you should create the tasks without it.
2. All items are created together or none. If the call fails, fix the cause shown in the error (for example a status or progress payment requirement) and call again; resending the same list never creates duplicates, it returns the tasks that already exist (`isReplay: true`). When `isReplay` is true on the first call for this list, tell the user these tasks already existed; to create the same list again on purpose, pass a new `requestKey`.
3. Write every returned `taskID` / `customTaskID` into the work list right away and show the user the key -> Laviya ID table.
4. If the user only wanted the tasks created (for example an analyst turning a document or presentation into tasks), stop here: do not call `laviya_start_delivery_run` or `laviya_start_task_work` for those tasks. If the analysis itself is tracked as a task, only that task is started and completed (step 5), so only its effort is recorded.
5. When you are about to implement the items, call `laviya_start_delivery_run` once with `{ "payload": { "taskIDs": [<every item you will work on, new and existing>], "title": "<work list name>" } }` and use the returned `id` as `deliveryRunID`. Never start a run for items you will not work on now.

## 5. Work through the items (only when the user asked for implementation)

Take the to-do items one at a time, in order (children before closing their parent):

1. Call `laviya_start_task_work` with `{ "payload": { "taskID": <id>, "deliveryRunID": <deliveryRunID> } }` right before starting the item and keep the returned `sessionID`. Mark the item `In progress` in the work list. Each new work session uses one Agent Orchestration credit; if the call fails with a credit limit, stop and tell the user.
   - When the item needs a branch, commit or pull request, name the branch `<type>/<customTaskID>-<short-slug>` (for example `feature/LVY-1234-export-endpoint`) and start every commit message and PR title with the `customTaskID` (`LVY-1234 - Add export endpoint`). Use `TASK-<taskID>` when `customTaskID` is empty. The Laviya GitHub integration then links them to the task automatically. Commit, push or open a PR only when the repository workflow or the user asks for it.
2. Implement the item following the repository conventions.
   - Before implementing, read every entry in `designReferences` returned by `laviya_start_task_work` and any Figma or Visily URL in the work-list item: Figma through the Figma MCP server (`figmaFileKey` / `figmaNodeID` when the tool asks for them), Visily through its `embedUrl` with a Visily or browser MCP server. If no suitable MCP server is available, tell the user and continue from the link title and the item description; never invent design details.
3. Verify it: build, tests, or the checks the repository uses. Never claim a check that was not run.
4. As soon as the item is complete and verified, call `laviya_complete_task_work` immediately, before starting anything else, with `{ "payload": { "taskID": <id>, "sessionID": <sessionID>, "comment": "<completion note>" } }`.
   - The comment says what changed, the main files, how it was verified (with results), and anything left for deploy or review.
   - When a screenshot or file helps the reviewer (UI change, report, log), add it with `laviya_add_task_comment` (`filePaths`) or `laviya_update_task_description`; never upload secrets, credentials or files the user did not ask to share.
   - Laviya measures the time between start and complete and records it as AI effort; never send or estimate hours yourself.
   - The task moves to the project's Ready for deploy status. Pass `targetStatus` only when the user names another status, and tell the user if the returned `targetStatus.name` is not Ready for deploy.
   - Never leave finished items open to complete them together at the end, and never wait for the user to ask: the measured time runs until this call, so a late call inflates the AI effort.
   - When items are worked in parallel (sub-agents, workflows), the worker that finishes an item completes it right away. Time shared by parallel sessions is split between them by the server.
   - If an item was finished earlier and is completed late anyway, pass `workEndedAt` (ISO 8601 with offset) with the time the work really ended.
   - If the call fails, call it again with the same `taskID` and `sessionID` (the comment or `targetStatus` may be corrected): steps that are already done are not repeated.
5. Mark the item `Ready for deploy` in the work list and give the user a one-line progress update.
6. If an item cannot be completed (blocked, failing verification, needs a decision), do not call `laviya_complete_task_work`. Explain the blocker and continue with the next independent item only if the user agrees; the open work session resumes when you start the item again.

## 6. Finish

When every approved item is handled, give a final table: key, item, Laviya ID, final state, measured effort, verification. The work list must show the same information.

## Work through assigned tasks

Use this instead of steps 1-4 when the user asks what is assigned to them or pending (for example "Hyundai projesinde bana atanmış bekleyen işlerim neler?") or asks to do their assigned tasks. The Laviya tasks are the work list; nothing is created.

1. Call `laviya_diagnostics`. Call `laviya_list_tasks` with the project the user named as `project` (name or task prefix), or without it for all their projects; the default is the open tasks assigned to the user. If the project matches several projects, show the candidates from the error and ask which one; then pass `projectID`. Use `lite: true` for long lists and follow `hasMore` with `page` when the user wants more.
2. Show one table: Laviya ID (`customTaskID`), title, status, priority (NoPriority 0, Low 1, Medium 2, High 3), estimated effort in hours (`estimatedEffort` is minutes), project. Say how many tasks there are in total (`totalCount`).
3. Ask which tasks to work on (all, or some of them) and in which order. Continue only with the tasks the user selects; never start one they did not select.
4. Call `laviya_start_delivery_run` once with `{ "payload": { "taskIDs": [<selected taskIDs>], "title": "<project> assigned tasks" } }` (max 100) and keep the returned `id` as `deliveryRunID`.
5. For each selected task, one at a time, follow step 5:
   - `laviya_get_task` (with `downloadAttachments: "images"` when the description has screenshots) to read the description, comments and attachments;
   - `laviya_start_task_work` with the task and `deliveryRunID`, keep `sessionID`;
   - implement, then verify;
   - `laviya_complete_task_work` immediately with that task's own completion comment. Every task gets its own measured effort, status change and comment; never complete several tasks with one call or one shared comment.
   - If a task is unclear or blocked, do not complete it: explain why and ask before continuing with the next one.
6. Finish with the table of step 6 (Laviya ID, title, final state, measured effort, verification).

## Test stage

Use this when the user asks to test the tasks waiting in a test status (for example "Test statüsündeki işleri test et"). Nothing is closed without the user's approval.

1. Call `laviya_diagnostics`, then `laviya_list_tasks` with the project, `status: "<the project's test status name>"` (for example `"Test"`) and `assignedTo: "anyone"`. Show the table of "Work through assigned tasks" step 2 and ask which tasks to test; continue only with the selected ones. Use `laviya_start_delivery_run` once for them as in that section.
2. For each selected task, one at a time:
   - `laviya_get_task` and `laviya_list_test_cases` to read the task and its test cases. If it has no test cases, propose them and create only the approved ones with `laviya_create_test_cases`, or ask how to test it.
   - `laviya_start_task_work` with the task and `deliveryRunID`, keep `sessionID`. The task moves to the project's Processing status while it is tested; the final status is set when the work is completed.
   - Run the tests (the test cases' steps, the repository's automated tests, a browser check), then call `laviya_report_test_result` once per test case with `passed`, `failed`, `blocked` or `skipped` and the evidence (what was run, expected and observed, `filePaths` for screenshots or logs). Never report a result for a case that was not run.
   - Show the user the results (case, result, evidence) and ask what to do. Do not decide yourself.
   - Approved: `laviya_complete_task_work` with `targetStatus: "<the closing status the user named>"` (for example `"Completed"` or `"Verified"`) and a comment that sums up the results.
   - Failed, and the user agrees: `laviya_complete_task_work` with `targetStatus` set to the status the task goes back to (for example `"Processing"` or `"In Progress"`) and a comment listing the failed cases and what was observed. When the user asks for a bug, create it with `laviya_create_tasks` (`approvedByUser: true`, `taskTypeID: 10` (Bug), `parentTaskID: <tested task ID>`, the failed case and its evidence in the description).
   - `targetStatus` takes any status of the project's methodology except Rejected (Rejected needs a reason, which a completion never carries); if the named status does not exist, the error lists the allowed ones.
3. Finish with a table: Laviya ID, title, results (passed / failed / blocked / skipped), final status, bug opened.

A project can also start a Laviya agent flow automatically when a task enters the test status (an automation rule with the "Start AI agent flow" action). That run is worked through orchestration (`laviya_get_my_work`), not this cycle; its `test_result` step records the results on the task's test cases when `payload.details` is a JSON object whose `scenarios` carry `testCaseID` or `referenceID`. Closing the task stays a human decision there too: when the step reports failed tests the task keeps its status; otherwise the run moves the task to its completion status (for example Ready for deploy). Either way the user approves or sends it back.
