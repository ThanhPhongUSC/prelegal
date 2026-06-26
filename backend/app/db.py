"""SQLite access for the temporary V1 database.

The database is recreated fresh on each startup (it is a throwaway store for the
foundation, not yet a system of record). The path is configurable via the
``PRELEGAL_DB_PATH`` environment variable so tests can use a temp file.
"""

import os
import sqlite3
from contextlib import closing
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "prelegal.db"


def db_path() -> Path:
    return Path(os.environ.get("PRELEGAL_DB_PATH", DEFAULT_DB_PATH))


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create a fresh database with the ``users`` table."""
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
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


def upsert_user(email: str) -> None:
    """Record the user, ignoring a repeat sign-in with the same email."""
    with closing(connect()) as conn, conn:
        conn.execute("INSERT OR IGNORE INTO users (email) VALUES (?)", (email,))
