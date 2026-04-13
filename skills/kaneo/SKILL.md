---
name: kaneo
description: Manage tasks in Kaneo — create, read, update, delete tasks, add comments, search, and manage projects via the Kaneo MCP server. Use when asked to track work, create tasks, update descriptions, add comments, or move tasks between columns in a Kaneo project.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  topic: project-management
  api: kaneo
  version: 2.0.0
---

# Kaneo — Task Management

Manage tasks in a Kaneo project management workspace via the MCP server.

## When to use me

Use this skill when the user asks to manage work in Kaneo, including:
- create tasks or subtasks
- update task title, description, status, priority, assignee, or due date
- create, update, delete, list, and assign labels
- add, edit, list, or delete comments
- search tasks/projects/comments in Kaneo
- move tasks between columns or statuses in a Kaneo project

Do not use this skill for:
- non-Kaneo PM tools (Jira, Linear, GitHub Issues, Trello)
- local TODO or task-list files in the repository
- generic planning requests that do not require Kaneo API calls

## MCP Configuration

This skill uses the `mcp-kaneo` MCP server to communicate with Kaneo. The MCP server must be configured in your agent.

### Environment Variables

Required variables (set in your agent's MCP config):
- `KANEO_BASE_URL` — Kaneo instance URL **with `/api` suffix**
- `KANEO_TOKEN` — API token from Kaneo `Settings → API Keys → Create API Key`

### Agent Setup

#### Claude Code
```json
{
  "mcpServers": {
    "kaneo": {
      "command": "npx",
      "args": ["-y", "mcp-kaneo"],
      "env": {
        "KANEO_TOKEN": "${KANEO_TOKEN}",
        "KANEO_BASE_URL": "${KANEO_BASE_URL}"
      }
    }
  }
}
```

#### OpenCode
```json
{
  "mcp": {
    "kaneo": {
      "type": "local",
      "command": ["npx", "-y", "mcp-kaneo"],
      "environment": {
        "KANEO_BASE_URL": "${KANEO_BASE_URL}",
        "KANEO_TOKEN": "${KANEO_TOKEN}"
      }
    }
  }
}
```

#### Cursor / Cline
```json
{
  "mcpServers": {
    "kaneo": {
      "command": "npx",
      "args": ["-y", "mcp-kaneo"]
    }
  }
}
```

When the MCP server is configured, all Kaneo tools are available automatically.

### Secret handling (strict)

`KANEO_TOKEN` is secret and must never be exposed.

Forbidden:
- exposing token values in assistant responses
- including tokens in logs, errors, examples, or markdown

Allowed:
- reference variable names only (`KANEO_TOKEN`)
- use redaction (`Authorization: Bearer ***`)

## Project Label Registry (`docs/LABELS.md`)

When this skill is used in a code project, maintain `docs/LABELS.md`.

### Required behavior

1. **Read at start** — On first Kaneo action, read `docs/LABELS.md`.
2. **Create if missing** — If missing, create it before first label operation.
3. **Keep in sync** — After any label change, update `docs/LABELS.md`.
4. **Reconcile from MCP** — Use `kaneo_list_labels` as source of truth.

### File template

```md
# Labels

## Metadata
- Workspace: <workspace name or id>
- Project: <project name or id>
- Last synced: <ISO-8601 timestamp>

## Label Glossary

| Label | Color | Meaning | Usage Guidelines | Status |
|---|---|---|---|---|
| bug | #ef4444 | Defect in expected behavior | Use for reproducible issues | active |
| blocked | #f59e0b | Work cannot proceed | Add blocker reason in task | active |

## Notes
- Labels are workspace-scoped in Kaneo.
- Keep meanings concise and unambiguous.
```

### Sync rules

- New label in API but missing in file → add row with `Meaning: TODO`
- Label renamed or recolored → update the row
- Label deleted in API but in file → mark `Status: deprecated`
- Keep `Last synced` current

---

## MCP Tools Reference

### Workspaces

| Tool | Description |
|------|-------------|
| `kaneo_list_workspaces` | List all accessible workspaces |

### Projects

| Tool | Description |
|------|-------------|
| `kaneo_list_projects` | List projects in a workspace |
| `kaneo_get_project` | Get project details |
| `kaneo_create_project` | Create a new project |

### Tasks

| Tool | Description |
|------|-------------|
| `kaneo_create_task` | Create a new task |
| `kaneo_get_task` | Get task details |
| `kaneo_update_task_title` | Update task title |
| `kaneo_update_task_description` | Update task description |
| `kaneo_update_task_status` | Update task status (move to column) |
| `kaneo_update_task_priority` | Update task priority |
| `kaneo_update_task_assignee` | Update task assignee |
| `kaneo_update_task_due_date` | Update task due date |
| `kaneo_delete_task` | Delete a task |

### Labels

| Tool | Description |
|------|-------------|
| `kaneo_list_labels` | List workspace labels |
| `kaneo_create_label` | Create a new label |
| `kaneo_update_label` | Update label name or color |
| `kaneo_delete_label` | Delete a label |
| `kaneo_attach_label` | Attach label to task |
| `kaneo_detach_label` | Detach label from task |
| `kaneo_list_task_labels` | List labels on a task |

### Comments

| Tool | Description |
|------|-------------|
| `kaneo_add_comment` | Add comment to task |
| `kaneo_list_comments` | List comments on task |

### Search

| Tool | Description |
|------|-------------|
| `kaneo_search` | Search tasks, projects, workspaces |

---

## Task Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Read-only |
| `projectId` | string | Required on create |
| `title` | string | Required on create |
| `description` | string | Markdown supported |
| `status` | string | Column slug (e.g. `to-do`, `in-progress`) |
| `priority` | enum | `no-priority`, `low`, `medium`, `high`, `urgent` |
| `dueDate` | string | ISO 8601 |
| `userId` | string | Assignee user ID |

---

## Subtasks

Kaneo has no native subtask feature. Use this convention:
- Create a task and reference the parent in the description: `[Parent #12] Fix login bug`
- Or reference child tasks in the parent: `[Child #13], [Child #14]`

This is a community convention, not an API feature.

---

## Usage Examples

### Create a task
```
Create a task in kaneo called "Fix login bug" with high priority
```
Uses: `kaneo_create_task`

### List tasks
```
List my kaneo tasks in the "Frontend" project
```
Uses: `kaneo_list_projects` → filter tasks

### Update task status
```
Move the task "Fix login bug" to in-progress
```
Uses: `kaneo_update_task_status`

### Add a label
```
Create a label "bug" with color #ef4444 and attach it to task #5
```
Uses: `kaneo_create_label` → `kaneo_attach_label`

### Search tasks
```
Find all tasks with "authentication" in the title
```
Uses: `kaneo_search`

---

## Error Handling

MCP tool responses include:
- Success: standard response with data
- Error: error message with code

Common issues:
- Missing credentials → MCP server won't start
- Invalid token → 401 in tool response
- Invalid IDs → 404 in tool response

Check tool response for details.