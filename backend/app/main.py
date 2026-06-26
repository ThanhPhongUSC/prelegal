"""Prelegal V1 backend.

Serves the statically-built frontend and a small JSON API on port 8000. The
foundation only includes a fake login (no authentication): it records the user
in the temporary database and lets the frontend enter the platform.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import db

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = Path(os.environ.get("PRELEGAL_STATIC_DIR", REPO_ROOT / "frontend" / "out"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Prelegal", lifespan=lifespan)


class LoginRequest(BaseModel):
    email: str


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/login")
def login(payload: LoginRequest) -> dict:
    """Fake login: record the user and let them into the platform."""
    db.upsert_user(payload.email)
    return {"ok": True, "email": payload.email}


# Serve the static frontend export last so the API routes above take precedence.
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
