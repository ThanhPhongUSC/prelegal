"""Prelegal V1 backend.

Serves the statically-built frontend and a small JSON API on port 8000. The
foundation only includes a fake login (no authentication): it records the user
in the temporary database and lets the frontend enter the platform.
"""

import json
import os
from collections.abc import Iterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import catalog, chat, db

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = Path(os.environ.get("PRELEGAL_STATIC_DIR", REPO_ROOT / "frontend" / "out"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Prelegal", lifespan=lifespan)


class LoginRequest(BaseModel):
    email: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/login")
def login(payload: LoginRequest) -> dict:
    """Fake login: record the user and let them into the platform."""
    db.upsert_user(payload.email)
    return {"ok": True, "email": payload.email}


@app.get("/api/catalog")
def get_catalog() -> list[dict]:
    """The supported document types as ``{id, name, description}``."""
    return catalog.supported_types()


@app.get("/api/template/{doc_id}")
def get_template(doc_id: str) -> dict:
    """The Standard Terms for a document type as ``{id, name, markdown}``."""
    try:
        return catalog.get_template(doc_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown document type")


@app.post("/api/chat")
def chat_endpoint(payload: ChatRequest) -> StreamingResponse:
    """Stream the assistant reply, then emit the extracted document draft.

    Server-Sent Events: ``delta`` chunks of reply text, one ``draft`` event with
    the in-progress document (type + cover-page fields), then ``done``.
    """
    messages = [m.model_dump() for m in payload.messages]

    def event_stream() -> Iterator[str]:
        reply: list[str] = []
        for piece in chat.stream_reply(messages):
            reply.append(piece)
            yield _sse("delta", {"text": piece})
        full = [*messages, {"role": "assistant", "content": "".join(reply)}]
        draft = chat.extract_draft(full)
        yield _sse("draft", draft.model_dump())
        yield _sse("done", {})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Serve the static frontend export last so the API routes above take precedence.
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
