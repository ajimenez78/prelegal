import os
import sqlite3
from collections.abc import Iterator
from contextlib import closing
from pathlib import Path

SCHEMAS = [
    """
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        draft TEXT NOT NULL,
        messages TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
    """,
]


def db_path() -> Path:
    return Path(os.environ.get("DB_PATH", "prelegal.db"))


def init_db() -> None:
    """Create the database from scratch, discarding any previous data."""
    path = db_path()
    path.unlink(missing_ok=True)
    with closing(sqlite3.connect(path)) as conn:
        for schema in SCHEMAS:
            conn.execute(schema)


def get_db() -> Iterator[sqlite3.Connection]:
    """One connection per request, committed when the request succeeds.
    FastAPI may run the setup and teardown of a sync dependency on different
    threads, hence check_same_thread=False."""
    with closing(sqlite3.connect(db_path(), check_same_thread=False)) as conn:
        conn.row_factory = sqlite3.Row
        yield conn
        conn.commit()
