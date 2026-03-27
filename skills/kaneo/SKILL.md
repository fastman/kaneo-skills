---
name: kaneo
description: Manage tasks in Kaneo — create, read, update, delete tasks, add comments, search, and manage projects via the Kaneo API. Use when asked to track work, create tasks, update descriptions, add comments, or move tasks between columns in a Kaneo project.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  topic: project-management
  api: kaneo
  version: 1.1.0
---

# Kaneo — Task Management

Manage tasks in a Kaneo project management workspace via the REST API.

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

## Before starting

Check that all environment variables are set before making any requests:
- `KANEO_BASE_URL` — Kaneo instance URL **with `/api` suffix** (e.g. `https://your-kaneo-instance.com/api`)
- `KANEO_TOKEN` — Bearer token from `Settings → API Keys → Create API Key`

If not set, ask the user to provide them or set them in the environment.

Also, when using this skill inside a project repository:
- always read `docs/LABELS.md` at the start of the session (if it exists)
- if `docs/LABELS.md` does not exist, create it before first label operation
- treat `docs/LABELS.md` as the canonical per-project label glossary

## Setup

All requests require `Authorization: Bearer $KANEO_TOKEN` and `Content-Type: application/json`.

## Project Label Registry (`docs/LABELS.md`)

When this skill is used in a code project, maintain `docs/LABELS.md`.

### Required behavior

1. **Read at start**
   - On first Kaneo action in a session, read `docs/LABELS.md`.
2. **Create if missing**
   - If missing, create it using the template below.
3. **Keep in sync**
   - After any label change in Kaneo (create/update/delete/attach/detach), update `docs/LABELS.md` in the same run.
4. **Reconcile from API**
   - Use `GET /label/workspace/{workspaceId}` as source of truth for existing labels.

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
| bug | #ef4444 | Defect in expected behavior | Use for reproducible issues with clear steps | active |
| blocked | #f59e0b | Work cannot proceed | Add blocker reason and dependency in task description | active |

## Notes
- Labels are workspace-scoped in Kaneo.
- Keep meanings concise and unambiguous.
```

### Sync rules

- New API label missing in file → add row with `Meaning: TODO` and `Status: active`.
- API label renamed/recolored → update row.
- Deleted API label still in file → mark `Status: deprecated` (or remove if user requested strict pruning).
- Keep `Last synced` current whenever labels are reconciled.

## Key IDs

Most endpoints need one or more of these IDs. Gather them first:

 | ID            | How to get                                                       |
 |---------------|------------------------------------------------------------------|
 | `workspaceId` | `GET $KANEO_BASE_URL/auth/organization/list` → array item `id`   |
 | `projectId`   | `GET $KANEO_BASE_URL/project?workspaceId=<workspaceId>` → `id`   |
 | `taskId`      | `GET $KANEO_BASE_URL/task/tasks/<projectId>` → `id`              |
 | `activityId`  | `GET $KANEO_BASE_URL/activity/<taskId>` → `id` of type `comment` |
 | `labelId`     | `GET $KANEO_BASE_URL/label/workspace/<workspaceId>` → `id`       |

### List organizations
```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/auth/organization/list"
```

### Create a workspace
```bash
curl -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "<name>", "slug": "<slug>"}' \
  "$KANEO_BASE_URL/auth/organization/create"
```

### List projects in a workspace
```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/project?workspaceId=<workspaceId>"
```

### Create a project
```bash
curl -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "<name>", "workspaceId": "<workspaceId>", "slug": "<slug>", "icon": "<emoji>"}' \
  "$KANEO_BASE_URL/project"
```

### List tasks in a project
```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/task/tasks/<projectId>"
```

### Get columns in a project
```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/column/<projectId>"
```
Returns column `id` and `slug`. Use the `slug` for the `status` field.

### List labels in a workspace
```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/label/workspace/<workspaceId>"
```

---

## Task Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Read-only |
| `projectId` | string | Required on create |
| `title` | string | Required on create |
| `description` | string | Markdown supported |
| `status` | string | Column **slug** (e.g. `"to-do"`, `"in-progress"`, `"planned"`) |
| `priority` | enum | `no-priority`, `low`, `medium`, `high`, `urgent` |
| `dueDate` | string | ISO 8601 |
| `userId` | string | Assignee |
| `position` | number | Ordering within column |
| `number` | number | Read-only, human-readable |
| `createdAt` | string | Read-only |

> `columnId` is **not** needed on create or update — the API derives it automatically from `status`.

---

## Create a task

```
POST $KANEO_BASE_URL/task/<projectId>
```

Required fields: `title`, `description`, `priority`, `status`.

```bash
curl -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add OAuth2 login with Google and GitHub",
    "priority": "high",
    "status": "to-do"
  }' \
  "$KANEO_BASE_URL/task/<projectId>"
```

---

## Get a task

```
GET $KANEO_BASE_URL/task/<taskId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/task/<taskId>"
```

---

## Update task title

```
PUT $KANEO_BASE_URL/task/title/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "New title"}' \
  "$KANEO_BASE_URL/task/title/<taskId>"
```

---

## Update task description

```
PUT $KANEO_BASE_URL/task/description/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}' \
  "$KANEO_BASE_URL/task/description/<taskId>"
```

---

## Update task status (move to column)

```
PUT $KANEO_BASE_URL/task/status/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' \
  "$KANEO_BASE_URL/task/status/<taskId>"
```

> `status` must be the column **slug** (e.g. `"in-progress"`, `"to-do"`, `"done"`, `"planned"`), **not** the display name.

---

## Update task priority

```
PUT $KANEO_BASE_URL/task/priority/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priority": "urgent"}' \
  "$KANEO_BASE_URL/task/priority/<taskId>"
```

Valid values: `no-priority`, `low`, `medium`, `high`, `urgent`.

---

## Update task assignee

```
PUT $KANEO_BASE_URL/task/assignee/<taskId>
```

```bash
# Assign
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<userId>"}' \
  "$KANEO_BASE_URL/task/assignee/<taskId>"

# Unassign
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": null}' \
  "$KANEO_BASE_URL/task/assignee/<taskId>"
```

---

## Update task due date

```
PUT $KANEO_BASE_URL/task/due-date/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dueDate": "2026-04-15T23:59:00Z"}' \
  "$KANEO_BASE_URL/task/due-date/<taskId>"
```

---

## Update all task fields at once

```
PUT $KANEO_BASE_URL/task/<taskId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "...",
    "description": "...",
    "status": "in-progress",
    "priority": "high",
    "projectId": "...",
    "position": 0
  }' \
  "$KANEO_BASE_URL/task/<taskId>"
```

Required: `title`, `description`, `status`, `priority`, `projectId`, `position`.

---

## Delete a task

```
DELETE $KANEO_BASE_URL/task/<taskId>
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  "$KANEO_BASE_URL/task/<taskId>"
```

---

## Subtasks

The API has no `parentTaskId` field. To represent subtasks:
1. Create a task with parent reference in description (e.g. `"[Parent #12] Fix login bug"`)
2. Or use task number reference in description to link parent and child

---

## Labels

Use labels to categorize tasks (e.g. `bug`, `frontend`, `blocked`).

After label operations, immediately sync `docs/LABELS.md` (see Project Label Registry section).

### Label Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Read-only |
| `name` | string | Required on create |
| `color` | string | Required on create (hex string like `#22c55e`) |
| `workspaceId` | string | Required on create |
| `taskId` | string\|null | Optional on create; can be attached/detached later |
| `createdAt` | string | Read-only |

### Create a label

```
POST $KANEO_BASE_URL/label
```

```bash
curl -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "frontend",
    "color": "#22c55e",
    "workspaceId": "<workspaceId>"
  }' \
  "$KANEO_BASE_URL/label"
```

### List workspace labels

```
GET $KANEO_BASE_URL/label/workspace/<workspaceId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/label/workspace/<workspaceId>"
```

### Get one label

```
GET $KANEO_BASE_URL/label/<labelId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/label/<labelId>"
```

### Update a label

```
PUT $KANEO_BASE_URL/label/<labelId>
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "backend", "color": "#3b82f6"}' \
  "$KANEO_BASE_URL/label/<labelId>"
```

### Delete a label

```
DELETE $KANEO_BASE_URL/label/<labelId>
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  "$KANEO_BASE_URL/label/<labelId>"
```

### Attach label to task

```
PUT $KANEO_BASE_URL/label/<labelId>/task
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "<taskId>"}' \
  "$KANEO_BASE_URL/label/<labelId>/task"
```

### Detach label from task

```
DELETE $KANEO_BASE_URL/label/<labelId>/task
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  "$KANEO_BASE_URL/label/<labelId>/task"
```

### List labels on a task

```
GET $KANEO_BASE_URL/label/task/<taskId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/label/task/<taskId>"
```

---

## Comments

### Add a comment to a task

```
POST $KANEO_BASE_URL/activity/comment
```

```bash
curl -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<taskId>",
    "comment": "This is blocked by the database migration PR"
  }' \
  "$KANEO_BASE_URL/activity/comment"
```

### List all activities on a task

```
GET $KANEO_BASE_URL/activity/<taskId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/activity/<taskId>"
```

### Edit a comment

```
PUT $KANEO_BASE_URL/activity/comment
```

```bash
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityId": "<activityId>",
    "comment": "Updated comment text"
  }' \
  "$KANEO_BASE_URL/activity/comment"
```

### Delete a comment

```
DELETE $KANEO_BASE_URL/activity/comment
```

```bash
curl -X DELETE \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activityId": "<activityId>"}' \
  "$KANEO_BASE_URL/activity/comment"
```

---

## Search

```
GET $KANEO_BASE_URL/search?q=<query>&type=tasks&workspaceId=<workspaceId>
```

```bash
curl -H "Authorization: Bearer $KANEO_TOKEN" \
     "$KANEO_BASE_URL/search?q=authentication&type=tasks&workspaceId=<workspaceId>"
```

Query params:
- `q` (required) — search query
- `type` — `all`, `tasks`, `projects`, `workspaces`, `comments`, `activities`
- `workspaceId` — filter by workspace
- `projectId` — filter by project
- `limit` — 1-50, default 20
- `userEmail` — filter by assignee

---

## Common Workflows

### Create task and move to in progress
```bash
# Create
TASK=$(curl -s -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "...", "description": "...", "priority": "medium", "status": "to-do"}' \
  "$KANEO_BASE_URL/task/<projectId>")
TASK_ID=$(echo $TASK | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Move to In Progress
curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' \
  "$KANEO_BASE_URL/task/status/$TASK_ID"
```

### Add comment and close task
```bash
curl -s -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "<taskId>", "comment": "Done in PR #42"}' \
  "$KANEO_BASE_URL/activity/comment"

curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}' \
  "$KANEO_BASE_URL/task/status/<taskId>"
```

### Find task by title and update description
```bash
SEARCH=$(curl -s -H "Authorization: Bearer $KANEO_TOKEN" \
  "$KANEO_BASE_URL/search?q=user+auth&type=tasks&workspaceId=<workspaceId>")
TASK_ID=$(echo $SEARCH | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated after code review"}' \
  "$KANEO_BASE_URL/task/description/$TASK_ID"
```

### Create label and attach to task
```bash
LABEL=$(curl -s -X POST \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"blocked","color":"#ef4444","workspaceId":"<workspaceId>"}' \
  "$KANEO_BASE_URL/label")
LABEL_ID=$(echo $LABEL | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -X PUT \
  -H "Authorization: Bearer $KANEO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"<taskId>"}' \
  "$KANEO_BASE_URL/label/$LABEL_ID/task"
```

### Reconcile `docs/LABELS.md` from workspace labels
```bash
# 1) Pull labels from API
curl -s -H "Authorization: Bearer $KANEO_TOKEN" \
  "$KANEO_BASE_URL/label/workspace/<workspaceId>"

# 2) Update docs/LABELS.md:
#    - Add missing labels
#    - Update name/color changes
#    - Mark removed labels as deprecated
#    - Update Last synced timestamp
```

---

## Error Handling

- `400` — missing required fields
- `401` — invalid or missing bearer token
- `403` — no access to workspace/project
- `404` — task/project/workspace not found
- `500` — Kaneo server error

Check HTTP status code and response body for details.
