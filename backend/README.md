# Prelegal backend

FastAPI app that serves the static frontend export and the JSON API on
`http://localhost:8000`.

## Run locally

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

The frontend must be built first (`cd frontend && npm run build`) so that
`frontend/out` exists for the static mount.

## API

- `GET /api/health` — health check.
- `POST /api/signup` — register a user `{email, password}`; returns
  `{userId, email, token}` (409 if the email is taken).
- `POST /api/login` — sign in `{email, password}`; returns
  `{userId, email, token}` (401 on bad credentials).
- `POST /api/documents` — save the current draft to the signed-in user's history
  (`Authorization: Bearer <token>`). Takes `{documentType, title, fields}`.
- `GET /api/documents` — list the signed-in user's saved documents, newest first.
- `GET /api/documents/{id}` — one saved document in full (404 if not the user's).
- `GET /api/catalog` — the supported document types as `{id, name, description}`.
- `GET /api/template/{id}` — the Standard Terms for a document type as
  `{id, name, markdown}` (404 for an unknown id).
- `POST /api/chat` — AI drafting chat for any supported document type. Takes
  `{messages: [{role, content}]}` and streams Server-Sent Events: `delta` reply
  chunks, one `draft` event with the in-progress document (`{documentType,
  fields}`), then `done`. Uses LiteLLM over OpenRouter; requires
  `OPENROUTER_API_KEY` in the environment (passed from `.env` by the start
  scripts).

## Database

SQLite, recreated fresh on every startup (a throwaway store for V1). Holds
`users` (email + salted password hash + auth token) and `documents` (each user's
saved drafts). Path is `backend/prelegal.db`, overridable via `PRELEGAL_DB_PATH`.

## Tests

```bash
uv run pytest
```
