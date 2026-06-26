"""API tests for the V1 backend: auth, documents, catalog and chat."""

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


def _signup(client, email="user@example.com", password="secret123") -> str:
    """Register a user and return their auth token."""
    resp = client.post("/api/signup", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_signup_returns_token_and_records_user(client):
    resp = client.post("/api/signup", json={"email": "a@b.com", "password": "pw123456"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "a@b.com"
    assert body["token"]

    from app import db

    with db.connect() as conn:
        rows = conn.execute("SELECT email FROM users").fetchall()
    assert [r["email"] for r in rows] == ["a@b.com"]


def test_signup_rejects_duplicate_email(client):
    client.post("/api/signup", json={"email": "dup@b.com", "password": "pw123456"})
    resp = client.post("/api/signup", json={"email": "dup@b.com", "password": "other999"})
    assert resp.status_code == 409


def test_login_succeeds_with_correct_password(client):
    client.post("/api/signup", json={"email": "c@d.com", "password": "pw123456"})
    resp = client.post("/api/login", json={"email": "c@d.com", "password": "pw123456"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "c@d.com"
    assert resp.json()["token"]


def test_login_rejects_wrong_password(client):
    client.post("/api/signup", json={"email": "e@f.com", "password": "pw123456"})
    resp = client.post("/api/login", json={"email": "e@f.com", "password": "wrongpw"})
    assert resp.status_code == 401


def test_login_rejects_unknown_user(client):
    resp = client.post("/api/login", json={"email": "nobody@x.com", "password": "pw"})
    assert resp.status_code == 401


def test_documents_require_auth(client):
    assert client.get("/api/documents").status_code == 401
    resp = client.post(
        "/api/documents",
        json={"documentType": "CSA", "title": "x", "fields": []},
    )
    assert resp.status_code == 401


def test_save_and_list_documents(client):
    token = _signup(client)
    save = client.post(
        "/api/documents",
        headers=_auth(token),
        json={
            "documentType": "CSA",
            "title": "Acme cloud deal",
            "fields": [{"label": "Provider", "value": "Acme Inc"}],
        },
    )
    assert save.status_code == 200
    assert save.json()["title"] == "Acme cloud deal"

    listing = client.get("/api/documents", headers=_auth(token))
    assert listing.status_code == 200
    docs = listing.json()
    assert len(docs) == 1
    assert docs[0]["document_type"] == "CSA"
    assert "fields" not in docs[0]  # listing is a lightweight summary


def test_get_full_document(client):
    token = _signup(client)
    saved = client.post(
        "/api/documents",
        headers=_auth(token),
        json={
            "documentType": "CSA",
            "title": "Full doc",
            "fields": [{"label": "Provider", "value": "Acme Inc"}],
        },
    ).json()

    resp = client.get(f"/api/documents/{saved['id']}", headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["document_type"] == "CSA"
    assert body["fields"] == [{"label": "Provider", "value": "Acme Inc"}]


def test_users_cannot_read_each_others_documents(client):
    alice = _signup(client, email="alice@x.com")
    bob = _signup(client, email="bob@x.com")
    saved = client.post(
        "/api/documents",
        headers=_auth(alice),
        json={"documentType": "CSA", "title": "Alice doc", "fields": []},
    ).json()

    assert client.get(f"/api/documents/{saved['id']}", headers=_auth(bob)).status_code == 404
    assert client.get("/api/documents", headers=_auth(bob)).json() == []


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
