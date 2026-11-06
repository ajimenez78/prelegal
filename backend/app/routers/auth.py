"""Sign up, sign in and sign out with a session cookie."""

import secrets
import sqlite3

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.deps import SESSION_COOKIE, Db, Session, User
from app.passwords import hash_password, verify_password

router = APIRouter(prefix="/api")


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(LoginRequest):
    password: str = Field(min_length=8)


class UserOut(BaseModel):
    email: str


def normalize(email: str) -> str:
    return email.strip().lower()


def start_session(db: sqlite3.Connection, response: Response, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    db.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax")


@router.post("/signup")
def signup(body: SignupRequest, db: Db, response: Response) -> UserOut:
    email = normalize(body.email)
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, hash_password(body.password)),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(409, "An account with this email already exists")
    start_session(db, response, cursor.lastrowid)
    return UserOut(email=email)


@router.post("/login")
def login(body: LoginRequest, db: Db, response: Response) -> UserOut:
    email = normalize(body.email)
    row = db.execute(
        "SELECT id, password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    start_session(db, response, row["id"])
    return UserOut(email=email)


@router.post("/logout", status_code=204)
def logout(db: Db, response: Response, session: Session = None):
    db.execute("DELETE FROM sessions WHERE token = ?", (session,))
    response.delete_cookie(SESSION_COOKIE)


@router.get("/me")
def me(user: User) -> UserOut:
    return UserOut(email=user["email"])
