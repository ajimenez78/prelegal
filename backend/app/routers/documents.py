"""The signed-in user's saved documents. The draft and the chat messages are
stored as JSON in the shape the browser sends; the backend does not read them."""

import json
import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.deps import Db, User

router = APIRouter(prefix="/api/documents")


class DocumentIn(BaseModel):
    documentType: str
    title: str
    draft: dict
    messages: list[dict]


class DocumentSummary(BaseModel):
    id: int
    documentType: str
    title: str
    updatedAt: str


class DocumentOut(DocumentSummary):
    draft: dict
    messages: list[dict]


# The list skips the large draft and messages columns.
SUMMARY_COLUMNS = "id, document_type, title, updated_at"


def summary(row: sqlite3.Row) -> DocumentSummary:
    return DocumentSummary(
        id=row["id"],
        documentType=row["document_type"],
        title=row["title"],
        updatedAt=row["updated_at"],
    )


def full(row: sqlite3.Row) -> DocumentOut:
    return DocumentOut(
        **summary(row).model_dump(),
        draft=json.loads(row["draft"]),
        messages=json.loads(row["messages"]),
    )


def owned(db: sqlite3.Connection, user: sqlite3.Row, document_id: int) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?", (document_id, user["id"])
    ).fetchone()
    if row is None:
        raise HTTPException(404, "Document not found")
    return row


def values(body: DocumentIn) -> tuple:
    return (body.documentType, body.title, json.dumps(body.draft), json.dumps(body.messages))


@router.get("")
def list_documents(db: Db, user: User) -> list[DocumentSummary]:
    rows = db.execute(
        f"SELECT {SUMMARY_COLUMNS} FROM documents WHERE user_id = ?"
        " ORDER BY updated_at DESC, id DESC",
        (user["id"],),
    )
    return [summary(row) for row in rows]


@router.get("/{document_id}")
def get_document(document_id: int, db: Db, user: User) -> DocumentOut:
    return full(owned(db, user, document_id))


@router.post("", status_code=201)
def create_document(body: DocumentIn, db: Db, user: User) -> DocumentOut:
    cursor = db.execute(
        "INSERT INTO documents (document_type, title, draft, messages, user_id)"
        " VALUES (?, ?, ?, ?, ?)",
        (*values(body), user["id"]),
    )
    return full(owned(db, user, cursor.lastrowid))


@router.put("/{document_id}")
def update_document(document_id: int, body: DocumentIn, db: Db, user: User) -> DocumentOut:
    owned(db, user, document_id)
    db.execute(
        "UPDATE documents SET document_type = ?, title = ?, draft = ?, messages = ?,"
        " updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
        (*values(body), document_id),
    )
    return full(owned(db, user, document_id))
