import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers import auth, chat


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app(static_dir: Path) -> FastAPI:
    app = FastAPI(title="Prelegal", lifespan=lifespan)
    app.include_router(auth.router)
    app.include_router(chat.router)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Mounted last so /api routes take precedence. Skipped when the frontend
    # has not been built, e.g. when running the API alone in development.
    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
    return app


app = create_app(Path(os.environ.get("STATIC_DIR", "static")))
