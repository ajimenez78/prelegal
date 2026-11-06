import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def table_names(path: Path) -> list[str]:
    with sqlite3.connect(path) as conn:
        rows = conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        return [row[0] for row in rows]


def test_health(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_startup_creates_tables(client: TestClient, db_file: Path):
    assert {"users", "sessions", "documents"} <= set(table_names(db_file))


def test_startup_recreates_database(db_file: Path, tmp_path: Path):
    app = create_app(tmp_path / "missing")
    with TestClient(app):
        with sqlite3.connect(db_file) as conn:
            conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'h')")
    with TestClient(app):
        with sqlite3.connect(db_file) as conn:
            assert conn.execute("SELECT COUNT(*) FROM users").fetchone() == (0,)


def test_serves_frontend_alongside_api(db_file: Path, tmp_path: Path):
    static = tmp_path / "static"
    (static / "nda").mkdir(parents=True)
    (static / "index.html").write_text("login page")
    (static / "nda" / "index.html").write_text("nda page")
    with TestClient(create_app(static)) as c:
        assert c.get("/").text == "login page"
        assert c.get("/nda/").text == "nda page"
        assert c.get("/api/health").status_code == 200
