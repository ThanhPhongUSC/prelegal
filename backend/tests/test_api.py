"""API tests for the V1 foundation backend."""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(tmp_path / "test.db"))
    # A static dir with an index so we can verify the SPA is served at "/".
    static_dir = tmp_path / "out"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<!doctype html><title>Prelegal</title>")
    monkeypatch.setenv("PRELEGAL_STATIC_DIR", str(static_dir))

    # Import after env is set so module-level static mounting picks up the dir.
    import importlib

    import app.main as main

    importlib.reload(main)
    with TestClient(main.app) as c:
        yield c


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_login_records_user(client):
    resp = client.post("/api/login", json={"email": "user@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "email": "user@example.com"}

    from app import db

    with db.connect() as conn:
        rows = conn.execute("SELECT email FROM users").fetchall()
    assert [r["email"] for r in rows] == ["user@example.com"]


def test_login_is_idempotent(client):
    client.post("/api/login", json={"email": "dup@example.com"})
    client.post("/api/login", json={"email": "dup@example.com"})

    from app import db

    with db.connect() as conn:
        count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
    assert count == 1


def test_static_index_served(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "Prelegal" in resp.text


def test_catalog_lists_supported_types(client):
    resp = client.get("/api/catalog")
    assert resp.status_code == 200
    types = resp.json()
    ids = {t["id"] for t in types}
    # 11 supported types, with the NDA cover-page entry excluded.
    assert len(types) == 11
    assert {"Mutual-NDA", "CSA", "BAA"} <= ids
    assert "Mutual-NDA-coverpage" not in ids


def test_template_returns_markdown(client):
    resp = client.get("/api/template/Mutual-NDA")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Mutual Non-Disclosure Agreement"
    assert "Confidential Information" in body["markdown"]


def test_template_unknown_is_404(client):
    assert client.get("/api/template/Does-Not-Exist").status_code == 404


def test_chat_streams_reply_then_draft(client, monkeypatch):
    """The chat endpoint streams delta chunks, then the extracted draft."""
    from app import chat
    from app.document import CoverField, DocumentDraft

    monkeypatch.setattr(chat, "stream_reply", lambda messages: iter(["Hello ", "there"]))
    monkeypatch.setattr(
        chat,
        "extract_draft",
        lambda messages: DocumentDraft(
            documentType="CSA", fields=[CoverField(label="Provider", value="Acme Inc")]
        ),
    )

    resp = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert resp.status_code == 200
    body = resp.text

    assert "event: delta" in body
    assert "Hello " in body and "there" in body
    assert "event: draft" in body
    assert "CSA" in body
    assert "Acme Inc" in body
    assert "event: done" in body
