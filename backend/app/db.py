"""SQLite access for the temporary V1 database.

The database is recreated fresh on each startup (it is a throwaway store for the
foundation, not yet a system of record). The path is configurable via the
``PRELEGAL_DB_PATH`` environment variable so tests can use a temp file.

It holds two tables: ``users`` (sign-up/sign-in with a hashed password and an
auth token) and ``documents`` (a user's saved drafts).
"""

import hashlib
import json
import os
import secrets
import sqlite3
from contextlib import closing
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "prelegal.db"

_HASH_ITERATIONS = 100_000


def db_path() -> Path:
    return Path(os.environ.get("PRELEGAL_DB_PATH", DEFAULT_DB_PATH))


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create a fresh database with the ``users`` and ``documents`` tables."""
    path = db_path()
    if path.exists():
        path.unlink()
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(connect()) as conn, conn:
        conn.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                token TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                document_type TEXT NOT NULL,
                title TEXT NOT NULL,
                fields TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), _HASH_ITERATIONS
    )
    return digest.hex()


def create_user(email: str, password: str) -> dict | None:
    """Register a user. Returns ``{id, email, token}``, or None if email is taken."""
    salt = secrets.token_hex(16)
    stored = f"{salt}${_hash_password(password, salt)}"
    token = secrets.token_hex(24)
    try:
        with closing(connect()) as conn, conn:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, token) VALUES (?, ?, ?)",
                (email, stored, token),
            )
            return {"id": cur.lastrowid, "email": email, "token": token}
    except sqlite3.IntegrityError:
        return None


def authenticate(email: str, password: str) -> dict | None:
    """Verify credentials. Returns ``{id, email, token}`` on success, else None."""
    with closing(connect()) as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, token FROM users WHERE email = ?",
            (email,),
        ).fetchone()
    if row is None:
        return None
    salt, _, expected = row["password_hash"].partition("$")
    if _hash_password(password, salt) != expected:
        return None
    return {"id": row["id"], "email": row["email"], "token": row["token"]}


def user_for_token(token: str) -> dict | None:
    """Resolve an auth token to ``{id, email}``, or None if unknown."""
    with closing(connect()) as conn:
        row = conn.execute(
            "SELECT id, email FROM users WHERE token = ?", (token,)
        ).fetchone()
    return dict(row) if row else None


def save_document(
    user_id: int, document_type: str, title: str, fields: list[dict]
) -> dict:
    """Store a document draft for a user and return its summary."""
    with closing(connect()) as conn, conn:
        cur = conn.execute(
            "INSERT INTO documents (user_id, document_type, title, fields) "
            "VALUES (?, ?, ?, ?)",
            (user_id, document_type, title, json.dumps(fields)),
        )
        row = conn.execute(
            "SELECT id, document_type, title, created_at FROM documents WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()
    return dict(row)


def list_documents(user_id: int) -> list[dict]:
    """List a user's saved documents, newest first (without the fields payload)."""
    with closing(connect()) as conn:
        rows = conn.execute(
            "SELECT id, document_type, title, created_at FROM documents "
            "WHERE user_id = ? ORDER BY created_at DESC, id DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_document(user_id: int, doc_id: int) -> dict | None:
    """Return a user's full saved document, or None if not found."""
    with closing(connect()) as conn:
        row = conn.execute(
            "SELECT id, document_type, title, fields, created_at FROM documents "
            "WHERE id = ? AND user_id = ?",
            (doc_id, user_id),
        ).fetchone()
    if row is None:
        return None
    doc = dict(row)
    doc["fields"] = json.loads(doc["fields"])
    return doc
