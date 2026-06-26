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

## Database

SQLite, recreated fresh on every startup (a throwaway store for the V1
foundation). Path is `backend/prelegal.db`, overridable via `PRELEGAL_DB_PATH`.

## Tests

```bash
uv run pytest
```
