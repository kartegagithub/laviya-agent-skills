---
name: laviya-orchestrator
description: Use Laviya MCP tools for polling, starting, completing, and reporting execution lifecycle.
---

# Laviya Orchestrator Skill

Use only these tools for orchestration mechanics:

- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`

Rules:

- Do not create orchestration HTTP calls directly.
- Respect `PreviousWorks` and `LLMSystemPromptContent`.
- Always end with explicit completion success/failure.
