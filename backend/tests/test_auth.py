import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

CREDENTIALS = {"email": "Ann@Example.com", "password": "secret123"}


def signup(client: TestClient, credentials=CREDENTIALS):
    return client.post("/api/signup", json=credentials)


def test_signup_signs_the_user_in(client: TestClient):
    assert signup(client).json() == {"email": "ann@example.com"}
    assert client.get("/api/me").json() == {"email": "ann@example.com"}


def test_signup_stores_a_hash_not_the_password(client: TestClient, db_file: Path):
    signup(client)
    with sqlite3.connect(db_file) as conn:
        (stored,) = conn.execute("SELECT password_hash FROM users").fetchone()
    assert "secret123" not in stored


def test_signup_rejects_a_duplicate_email(client: TestClient):
    signup(client)
    response = signup(client, {"email": "ann@example.com", "password": "other1234"})
    assert response.status_code == 409


def test_signup_rejects_a_short_password(client: TestClient):
    response = signup(client, {"email": "a@b.com", "password": "short"})
    assert response.status_code == 422


def test_me_requires_a_session(client: TestClient):
    assert client.get("/api/me").status_code == 401


def test_logout_ends_the_session(client: TestClient):
    signup(client)
    assert client.post("/api/logout").status_code == 204
    assert client.get("/api/me").status_code == 401


def test_login_after_logout(client: TestClient):
    signup(client)
    client.post("/api/logout")
    response = client.post("/api/login", json=CREDENTIALS)
    assert response.json() == {"email": "ann@example.com"}
    assert client.get("/api/me").status_code == 200


def test_login_rejects_a_wrong_password(client: TestClient):
    signup(client)
    client.post("/api/logout")
    response = client.post("/api/login", json={**CREDENTIALS, "password": "wrong-pass"})
    assert response.status_code == 401


def test_login_rejects_an_unknown_email(client: TestClient):
    response = client.post("/api/login", json=CREDENTIALS)
    assert response.status_code == 401
