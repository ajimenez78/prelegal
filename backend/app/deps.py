"""Shared request dependencies: the database connection and the signed-in user."""

import sqlite3
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException

from app.db import get_db

SESSION_COOKIE = "session"

# A yield dependency defaults to "request" scope, which commits only after the
# response is sent. "function" commits first, so the client never sees a write
# (a new session, a saved document) before it is stored.
Db = Annotated[sqlite3.Connection, Depends(get_db, scope="function")]
Session = Annotated[str | None, Cookie()]


def current_user(db: Db, session: Session = None) -> sqlite3.Row:
    row = db.execute(
        "SELECT users.id, users.email FROM sessions"
        " JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?",
        (session,),
    ).fetchone()
    if row is None:
        raise HTTPException(401, "Not signed in")
    return row


User = Annotated[sqlite3.Row, Depends(current_user)]
