# Prelegal — Claude Code Instructions

## Project Overview

Prelegal is a SaaS product that allows users to draft legal agreements via AI chat. Users interact with the AI to identify the document they want and fill in the required fields. Available document types are defined in `catalog.json` at the project root.

> **Note:** the description above is the product vision. For what is actually built today, see [Current Implementation Status](#current-implementation-status) at the end of this file.

---

## Development Process

When instructed to build a feature, follow these steps in order — do not skip any:

1. **Read the feature spec** — Use your Atlassian/Jira tools to pull the full feature instructions, then move the Jira ticket to **In Progress**
2. **Follow the feature-dev 7-step process** — Complete every step without skipping
3. **Test thoroughly** — Write unit tests and integration tests; fix any issues before proceeding
4. **Submit a PR** — Use your GitHub tools to open a pull request, then move the Jira ticket to **In Review**
5. **After the PR is merged** — Move the Jira ticket to **Done**

> **Jira ticket workflow:** keep the ticket status in sync with the work — move it to **In Progress** when you start working on it, **In Review** when the PR is opened, and **Done** once the PR is merged. The board's workflow is To Do → In Progress → In Review → Done.

---

## AI / LLM Design

When writing code that calls an LLM:

- **Use LiteLLM via OpenRouter**
- **Model:** `openai/gpt-oss-120b:free` (free tier — note: OpenRouter routes to whichever free provider is available, not guaranteed Cerebras)
- **Extract structured fields** to populate the legal document. Note: the free `gpt-oss-120b` provider does **not** reliably honor `response_format` (typed/JSON-object structured outputs) — prefer a JSON-only prompt with the schema plus defensive parsing (see `backend/app/chat.py`).
- **API key:** `OPENROUTER_API_KEY` is in `.env` at the project root

---

## Technical Design

### Stack

| Layer | Technology |
|-------|-----------|
| Container | Docker (entire project packaged) |
| Backend | `backend/` — Python [uv](https://github.com/astral-sh/uv) project, FastAPI |
| Frontend | `frontend/` — statically built, served via FastAPI |
| Database | SQLite — created fresh on each container start; holds a `users` table (sign-up/sign-in with a hashed password + auth token) and a `documents` table (each user's saved drafts) |

Backend runs at: `http://localhost:8000`

### Scripts

Platform-specific start/stop scripts live in `scripts/`:

```
scripts/start-mac.sh
scripts/stop-mac.sh

scripts/start-linux.sh
scripts/stop-linux.sh

scripts/start-windows.ps1
scripts/stop-windows.ps1
```

---

## Color Scheme

| Role | Token | Hex |
|------|-------|-----|
| Accent | Yellow | `#ecad0a` |
| Primary | Blue | `#209dd7` |
| Secondary (submit buttons) | Purple | `#753991` |
| Headings | Dark Navy | `#032147` |
| Body text | Gray | `#888888` |

---

## Current Implementation Status

The sections above describe the **target** design. What is built today:

- **Foundation (PL-4):** the full stack from the table above is in place. The FastAPI backend (`backend/`) serves the statically-exported frontend (`frontend/out`) and the API on `http://localhost:8000`, backed by a temporary SQLite DB recreated on each startup. The whole app is packaged via the multi-stage `Dockerfile`, run through the `scripts/` start/stop commands (Docker-based).
- **Auth (PL-7):** a real **sign-in / sign-up screen** at `/`. Users register with email + password (salted PBKDF2 hash); on success the backend returns an auth token kept in `localStorage` and sent as `Authorization: Bearer <token>` on per-user calls. Throwaway DB, so accounts reset on restart.
- **Product feature (PL-6):** the creator at `/creator` is **generic over all 11 supported document types** (the catalog, minus the NDA cover-page entry). A single chat + editable preview drives any type. If the user asks for an unsupported document, the assistant explains it can't generate that and offers the closest supported type.
- **AI chat (PL-5/PL-6):** `/creator` shows an AI chat pane beside a live, directly-editable preview. The assistant guides the user, and the preview shows an editable **cover page** (the collected fields) plus the **Standard Terms rendered verbatim** from the chosen template's Markdown (legal text is never AI-generated). A **draft disclaimer** (subject to legal review) is shown and printed atop the document. The chat refocuses the input after each turn and always asks a follow-up when more info is needed.
- **Document history (PL-7):** users **Save** a draft (type + cover fields) from the creator and revisit it on the **My Documents** page at `/documents`; opening one reloads it into the creator via `?doc=<id>`. Saved docs are scoped to the user and stored in the `documents` table.
- **AI / LLM:** wired up via **LiteLLM over OpenRouter** (`openai/gpt-oss-120b:free`). Each chat turn streams the reply, then extracts a generic document draft (`{documentType, fields[]}`) from the conversation. The free provider does not reliably honor `response_format`, so extraction uses a JSON-only prompt plus defensive parsing.

### Backend API

- `GET /api/health` — health check.
- `POST /api/signup` — register `{email, password}`; returns `{userId, email, token}` (409 if taken).
- `POST /api/login` — sign in `{email, password}`; returns `{userId, email, token}` (401 on bad creds).
- `POST /api/documents` — save a draft `{documentType, title, fields}` to the signed-in user (Bearer token).
- `GET /api/documents` — list the user's saved documents (newest first); `GET /api/documents/{id}` returns one in full.
- `GET /api/catalog` — supported document types as `{id, name, description}`.
- `GET /api/template/{id}` — Standard Terms for a type as `{id, name, markdown}` (404 if unknown).
- `POST /api/chat` — AI drafting chat. Takes `{messages: [{role, content}]}` and streams Server-Sent Events: `delta` reply chunks, one `draft` event with the in-progress document (`{documentType, fields[]}`), then `done`. Requires `OPENROUTER_API_KEY` (the start scripts pass it in via `--env-file .env`).

### Layout

```
backend/    FastAPI (uv) app: app/main.py (routes + static mount), app/db.py (SQLite),
            app/chat.py (LiteLLM stream + extract), app/document.py (DocumentDraft + prompts),
            app/catalog.py (supported types + templates)
frontend/   Next.js static export; / = sign in/up, /creator = chat + editable preview for any type,
            /documents = saved-document history (components/AuthScreen.tsx, TopBar.tsx,
            DocumentChat.tsx, DocumentPreview.tsx, DocumentCreator.tsx, SaveDialog.tsx,
            DocumentsList.tsx; lib/auth.ts token storage, lib/chat.ts SSE client,
            lib/document.ts catalog/template/documents API)
scripts/    Docker-based start/stop per OS
templates/  Common Paper legal templates (PL-2)
catalog.json, Dockerfile, .dockerignore
```

---
