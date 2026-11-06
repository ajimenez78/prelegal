import os
import sqlite3
from contextlib import closing
from pathlib import Path

USERS_SCHEMA = """
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
"""


def db_path() -> Path:
    return Path(os.environ.get("DB_PATH", "prelegal.db"))


def init_db() -> None:
    """Create the database from scratch, discarding any previous data."""
    path = db_path()
    path.unlink(missing_ok=True)
    with closing(sqlite3.connect(path)) as conn:
        conn.execute(USERS_SCHEMA)
