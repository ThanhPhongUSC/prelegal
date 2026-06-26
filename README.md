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

Sign-in is a placeholder for now (no authentication): entering an email brings
you into the platform.

## Run

Requires Docker. From the project root:

```bash
scripts/start-mac.sh     # or start-linux.sh / start-windows.ps1
```

Open http://localhost:8000. To stop:

```bash
scripts/stop-mac.sh      # or stop-linux.sh / stop-windows.ps1
```
