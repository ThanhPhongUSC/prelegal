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
- `POST /api/login` — fake login (no authentication). Records `{email}` in the
  temporary SQLite `users` table and returns `{ok, email}`.
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

SQLite, recreated fresh on every startup (a throwaway store for the V1
foundation). Path is `backend/prelegal.db`, overridable via `PRELEGAL_DB_PATH`.

## Tests

```bash
uv run pytest
```
