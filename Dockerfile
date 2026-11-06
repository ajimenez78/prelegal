# Stage 1: build the Next.js frontend as a static export.
# The frontend reads ../templates and ../catalog.json at build time, so they are copied
# side by side.
FROM node:26-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY templates/ /build/templates/
COPY catalog.json /build/catalog.json
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend serving the API and the exported site.
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PATH="/app/.venv/bin:$PATH"
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev
COPY backend/app ./app
COPY --from=frontend /build/frontend/out ./static
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
