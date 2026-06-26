"""Prelegal V1 backend.

Serves the statically-built frontend and a small JSON API on port 8000. Supports
multiple users: sign-up and sign-in with a hashed password, and per-user storage
of generated document drafts. The database is throwaway and reset on each start.
"""

import json
import os
from collections.abc import Iterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import catalog, chat, db
from app.document import CoverField

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = Path(os.environ.get("PRELEGAL_STATIC_DIR", REPO_ROOT / "frontend" / "out"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Prelegal", lifespan=lifespan)


class CredentialsRequest(BaseModel):
    email: str
    password: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class SaveDocumentRequest(BaseModel):
    documentType: str
    title: str
    fields: list[CoverField]


def current_user(authorization: str = Header(default="")) -> dict:
    """Resolve the ``Authorization: Bearer <token>`` header to a user, or 401."""
    token = authorization.removeprefix("Bearer ").strip()
    user = db.user_for_token(token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/signup")
def signup(payload: CredentialsRequest) -> dict:
    """Register a new user and return their auth token."""
    user = db.create_user(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=409, detail="Email already registered")
    return {"userId": user["id"], "email": user["email"], "token": user["token"]}


@app.post("/api/login")
def login(payload: CredentialsRequest) -> dict:
    """Sign in an existing user and return their auth token."""
    user = db.authenticate(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"userId": user["id"], "email": user["email"], "token": user["token"]}


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


@app.post("/api/documents")
def create_document(
    payload: SaveDocumentRequest, user: dict = Depends(current_user)
) -> dict:
    """Save the current document draft to the signed-in user's history."""
    return db.save_document(
        user["id"],
        payload.documentType,
        payload.title,
        [f.model_dump() for f in payload.fields],
    )


@app.get("/api/documents")
def get_documents(user: dict = Depends(current_user)) -> list[dict]:
    """List the signed-in user's saved documents, newest first."""
    return db.list_documents(user["id"])


@app.get("/api/documents/{doc_id}")
def get_one_document(doc_id: int, user: dict = Depends(current_user)) -> dict:
    """Return one of the signed-in user's saved documents in full."""
    doc = db.get_document(user["id"], doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


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
