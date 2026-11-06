---
name: laviya-prd-intake
description: Turn a PRD (claude.ai artifact link, Markdown file or pasted text) into Laviya work - break it into epics, stories and tasks with estimates, priority, assignees, sprint and design links, plus test scenarios; show one preview, and after the user approves create the sprints, the whole hierarchy in one laviya_create_tasks call, the test cases and (when asked) a wiki, then write each Laviya ID back next to its PRD item. Re-running on the same PRD never creates duplicates. Use when the user asks to turn a PRD, spec or requirements document into Laviya epics, stories, tasks, sprints or test cases.
---

# Laviya PRD Intake

This skill plans work from a PRD and creates it in Laviya after the user approves it. It does not implement anything and runs outside Laviya orchestration: do not call `laviya_get_my_work`, `laviya_start_execution`, `laviya_complete_execution`, `laviya_start_delivery_run`, `laviya_start_task_work` or `laviya_complete_task_work` here. Implementation is handed to the `laviya-delivery-cycle` skill at the end.

Laviya tools used:

- `laviya_diagnostics`: confirm the MCP runtime and API host.
- `laviya_list_projects`: let the user pick the target project.
- `laviya_list_sprints`, `laviya_create_sprint`: find or create (idempotent by name) the sprints the PRD names.
- `laviya_list_tasks`: check existing parents or possible duplicates in the project (read-only).
- `laviya_create_tasks`: create the approved hierarchy in one call (`parentReferenceID`, `folderID`, `links`, `assigneeEmails`); idempotent by `requestKey`.
- `laviya_create_test_cases`: create the approved test scenarios on their story or task (idempotent by `referenceID`).
- `laviya_create_wiki`: only when the user asks for the PRD or its technical notes in the wiki (idempotent by name).
- `laviya_get_task`: read a task when the PRD refers to an existing one.

Everything is written on behalf of the api key owner and carries Laviya's AI marker. Talk to the user in their language; write Laviya titles, descriptions, test cases and wiki pages in the language of the PRD.

## The PRD is the source of truth

- The PRD is a claude.ai artifact (read it with the Artifact tool, republish the same artifact to write back), a Markdown file (edit in place) or pasted text (save it as a Markdown file first; ask where).
- PRD identity: the `PRD-ID:` line near the top. If there is none, derive a slug from the title (lowercase, `a-z0-9-`, max 40 characters, e.g. `order-export`) and add `PRD-ID: <slug>` under the title when you write the IDs back.
- Stable keys follow the PRD order: epics `E-1`, stories `S-1.2` (story 2 of epic 1), tasks `T-1.2.3`, test scenarios `TC-1.2.1` (scenario 1 of story 1.2, or `TC-1.2.3.1` when it belongs to a task). A story without an epic is `S-0.n`; a task directly under an epic is `T-1.0.n`. Keys never change once written into the PRD; new items get the next free number.
- Write-back format, on the item's heading or line: `- Laviya: LVY-1234 (#1234)`; for a test scenario `- Laviya: TC-1.1.1 on LVY-1235`. An item that already carries `Laviya:` is never sent to `laviya_create_tasks` or `laviya_create_test_cases` again.

## 1. Preflight

1. Call `laviya_diagnostics`. Stop and tell the user if the MCP runtime is not reachable.
2. Load the PRD. If intake files from an earlier run exist next to it (`<prd file name>.laviya-intake*.json`), finish them first as described in section 5, before planning anything new. Then list the items that already carry a Laviya ID: they are skipped, and they can still be parents of new items (`parentTaskID`).
3. Ask which Laviya project the work belongs to (`laviya_list_projects`, with `search` when the PRD or the user names one); never assume it from configuration. Show the project name and task prefix.
4. Call `laviya_list_sprints` for the project to match the sprint names the PRD uses.

## 2. Break the PRD down (read-only)

For every item without a Laviya ID, propose:

- type: Epic 80 for a feature area, Story 70 for a user-visible outcome, Task 0 for a unit of implementation work (Bug 10 / Improvement 30 only when the PRD says so).
- title (short, imperative), description (plain text: the PRD wording, acceptance criteria, relevant technical notes).
- estimate in hours on tasks, and on stories that have no tasks. Leave epics and stories with tasks unestimated so effort is not counted twice; show their sums in the preview.
- priority (NoPriority 0, Low 1, Medium 2, High 3; the story's priority is inherited by its tasks unless the PRD says otherwise) and complexity (Easy 0, Normal 1, Hard 2, Expert 3).
- assignees: only e-mails the PRD or the user names; otherwise the creator (you). Assigning others needs PM permission.
- sprint: the sprint the PRD names for the item (tasks inherit their story's sprint); mark sprints that do not exist yet as new. Epics usually stay without a sprint.
- design links: Figma, Visily or other http(s) links of the item (max 10 per item), on the story and the tasks that implement that screen.
- test scenarios: one test case per PRD scenario (title, preconditions, steps, expected result) on the story it belongs to, or the task when it names one. Propose scenarios for acceptance criteria that have none, and mark them as proposed.

Do not guess what the PRD does not say: list open questions (missing estimates, unclear owner, ambiguous scope) instead of inventing answers.

## 3. Preview and approval

Show one preview: the project, then these tables, then the open questions. Show names, not numeric codes.

Example for `docs/examples/prd-order-export.md` in the laviya-agent-skills repository:

Project: Shop Admin (SA). Sprints: Sprint 12 (exists, #42), Sprint 13 (new). Skipped (already in Laviya): none.

| Key | Type | Title | Parent | Priority | Est. (h) | Sprint | Assignee | Links |
|---|---|---|---|---|---|---|---|---|
| E-1 | Epic | Order export | - | High | (19) | - | me | - |
| S-1.1 | Story | Export the order list as CSV | E-1 | High | (9) | Sprint 12 | me | Figma 12-345 |
| T-1.1.1 | Task | Stream filtered orders as CSV from GET /orders/export | S-1.1 | High | 6 | Sprint 12 | me | - |
| T-1.1.2 | Task | Add the Export CSV button to the order list | S-1.1 | High | 3 | Sprint 12 | frontend@example.com | Figma 12-345 |
| S-1.2 | Story | E-mail large exports | E-1 | Medium | (10) | Sprint 13 | me | - |
| T-1.2.1 | Task | Background job that e-mails a 24-hour download link | S-1.2 | Medium | 8 | Sprint 13 | me | - |
| T-1.2.2 | Task | Show the e-mail message for large exports | S-1.2 | Medium | 2 | Sprint 13 | me | - |

| Key | On | Test case | Steps | Expected result |
|---|---|---|---|---|
| TC-1.1.1 | S-1.1 | Export with a date filter | Open Orders; filter last 7 days; click Export CSV | Only those orders and a header row |
| TC-1.1.2 | S-1.1 | Export with no orders | Filter a day without orders; click Export CSV | Only the header row |
| TC-1.2.1 | S-1.2 | Large export is e-mailed | Export more than 10,000 orders | The page shows the e-mail message; the link arrives within 10 minutes |

Open questions: none. Wiki: not requested.

Ask the user to approve the exact plan (project, sprints, items, test cases, wiki). They may edit, remove or add items; show the changed preview again. Continue only after explicit approval; approval covers only what was in the last preview.

## 4. Create in Laviya

Run these steps in order and stop at the first error; every step can be repeated safely.

1. Sprints: for each new sprint call `laviya_create_sprint` with `approvedByUser: true`, `projectID`, `name` (and dates if the PRD gives them). It returns the existing folder (`isExisting: true`) when the name is taken, so a re-run never creates a second sprint. Keep each sprint's folder ID.
2. Intake file: write `{ "payload": { ... }, "requestKey": null, "created": null }` to `<prd file name>.laviya-intake.json` next to the PRD (for an artifact, in the working folder the user chose). `payload` is the exact `laviya_create_tasks` payload without `approvedByUser` and `requestKey`: `projectID`, `methodologyStatusID` / `progressPaymentID` / `folderID` when used, and `tasks`. Items are ordered parents first; children use `parentReferenceID`, children of items already in Laviya use `parentTaskID`; `referenceID` is the key, `folderID` the item's sprint, `estimatedEffortHours`, `links`, `assigneeEmails` as approved. Never overwrite an intake file that already exists: finish it first (section 5).
   - More than 50 items: split into batches of at most 50, each with its own intake file `<prd file name>.laviya-intake.<first key>.json` (e.g. `.E-1.json`, or `.S-1.4.json` when one epic alone has more than 50 items and is split by story). Each batch is ordered parents first; a batch whose parent is in an earlier batch uses that parent's `parentTaskID` from the earlier batch's `created`, so create the batches one after another.
3. Request key: derived from PRD identity and content, so the same approved payload always gets the same key and a changed payload (other project, status, sprint or items) a new one:
   `prd-<PRD-ID>-<first 16 hex characters of the SHA-256 of the intake file's payload>`. Compute it, do not invent it, and store it in the intake file's `requestKey`:
   ```bash
   node -e "const f=require('fs'),c=require('crypto');const p=JSON.parse(f.readFileSync(process.argv[1],'utf8'));console.log(c.createHash('sha256').update(JSON.stringify(p.payload)).digest('hex').slice(0,16))" "<intake file>"
   ```
4. Call `laviya_create_tasks` once per intake file with `{ "payload": { "approvedByUser": true, "requestKey": "<stored key>", ...<intake payload> } }`. All items of the call are created together or none. Right after it succeeds, store `created` (`referenceID` -> `taskID`, `customTaskID`) in the intake file, before any write-back.
   - `isReplay: true` means this exact payload was already created earlier (for example the write-back was interrupted); use the returned IDs and tell the user nothing new was created.
   - An error that the request key was already used with a different request means the intake file was edited after a create with that key; do not change the key by hand. Read the PRD and the intake file again and check with `laviya_list_tasks` (`projectID`, `assignedTo: "anyone"`, `status: "all"`, `search`: title) which items exist before going on.
   - An error that the tasks created with this request key were deleted: tell the user and ask whether to create them again. Only on approval, store the key with a `-r2` suffix (`-r3`, ... on later repeats) in the intake file and call again.
   - If assigning other people is rejected (no PM permission), ask the user; on approval remove `assigneeEmails`, update the intake file and compute the key again (the failed call created nothing).
   - Fix other errors (status or progress payment requirement, invalid link) as the error says, update the intake file, compute the key again and call again.
5. Write back right away from the intake file's `created`: put `- Laviya: <customTaskID> (#<taskID>)` next to every created item in the PRD and show the key -> Laviya ID table. Report `tasks[].linkErrors` (the task is created, the link is not).
6. Test cases: for each story or task with approved scenarios, call `laviya_create_test_cases` with `approvedByUser: true`, `taskID` and `cases` (the `TC-` key as `referenceID`, max 50 per call). Repeating the call updates the same cases. Write `- Laviya: TC-x on <customTaskID>` next to each scenario.
7. Wiki (only when the user asked): `laviya_create_wiki` with `approvedByUser: true`, `projectID`, `name` (the PRD title, or "<PRD title> - Technical notes"), `content` (the PRD text or its technical notes as Markdown) and `relatedTaskIDs` (the epics and stories, max 50). An existing wiki with the same name is returned unchanged (`isExisting: true`); tell the user and use `laviya_update_wiki` only if they approve a change.
8. Delete each intake file only after every item in its `created` is written back to the PRD and its test cases are created. If the user wants a record, rename it to `<prd file name>.laviya-done.<first key>.json` instead, so it is not resumed.

## 5. Re-running on the same PRD

- Intake files decide the resume, not the PRD annotations. For every `<prd file name>.laviya-intake*.json`, whether the PRD carries none, some or all of its IDs: if `created` is filled, use it; otherwise resend its payload unchanged with its stored `requestKey` (Laviya replays the stored result, or creates the batch if the earlier call never succeeded) and store `created`. Then finish the write-back for every item in it, its test cases (step 6) and step 8. Only after that plan new items.
- Items with `Laviya:` are skipped; when nothing is left to create, say so and stop. New items (added to the PRD later) get new keys and are created as above, under their existing parents with `parentTaskID`.
- The replay is per api key owner. When someone else ran the PRD before and the IDs were not written back, check with `laviya_list_tasks` (`search` by title) before creating.

## 6. Hand-off

Finish with one table: key, type, title, Laviya ID, sprint, test cases, assignee. Then offer to implement the work with the `laviya-delivery-cycle` skill: the annotated PRD is its work list, the items already carry Laviya IDs so nothing is created again, and it starts a delivery run only for the tasks the user picks.
