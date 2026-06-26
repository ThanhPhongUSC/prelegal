# prelegal

A platform for drafting common legal agreements.

## Status

🚧 **Work in progress** — this project is currently under active development and is expected to be completed within 1 week (target: 2026-07-02).

## Architecture

- **`frontend/`** — Next.js app, statically exported to `frontend/out`.
- **`backend/`** — FastAPI (uv) app that serves the static frontend and the API
  on `http://localhost:8000`, backed by a temporary SQLite database.
- **`Dockerfile`** — multi-stage build: the frontend is built, then the backend
  serves it. The whole app runs as a single container.

Users sign up and sign in with an email and password, then draft documents and
save them to their personal history. The SQLite database is still throwaway (it
is reset on every startup), so accounts and saved documents do not persist across
restarts.

## Run

Requires Docker. From the project root:

```bash
scripts/start-mac.sh     # or start-linux.sh / start-windows.ps1
```

Open http://localhost:8000. To stop:

```bash
scripts/stop-mac.sh      # or stop-linux.sh / stop-windows.ps1
```
