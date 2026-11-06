# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

Currently only the Mutual NDA document is supported, with no AI chat yet. See "Current status" below.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

Use OpenAI API make calls to LLMs. Use `gpt-6-luna` model. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENAI_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/ and be a next project.
The NextJS site must be served at /  
The database shuld use SQLLite and be created from scratch each time the Docker container is brouth up, allowing for a users table with sign up and sign in.
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## UI
For creating and designing the web interface, use the Pearl web design skill.

## Current status

Implemented so far (PL-2, PL-3, PL-4):
- `templates/` and `catalog.json`: the 12 Common Paper templates.
- Single Docker container (multi-stage `Dockerfile`): FastAPI on port 8000 serves `/api` and the Next.js static export at `/`.
- Backend (`backend/app/`):
  - `main.py`: app factory, lifespan and static mount, which is registered last so `/api` routes win.
  - `db.py`: stdlib `sqlite3`. A fresh DB with a `users` table is created on every start, at `DB_PATH`, default `prelegal.db`.
  - `routers/auth.py`: stub `POST /api/login` that accepts any credentials.
  - `GET /api/health`.
- Frontend:
  - Fake login at `/` (`LoginForm.tsx`) goes to the Mutual NDA builder at `/nda`.
  - NDA templates are read from `../templates` at build time.
  - Pearl tokens are in `globals.css`.
- The start and stop scripts in `scripts/` are done. The `.env` file is passed with `--env-file` at run time.

Not done yet:
- Real sign up and sign in. The `users` table exists but is unused.
- The AI chat.
- Document types other than the Mutual NDA.

Gotchas:
- `next.config.ts` cannot use `cacheComponents` or `partialPrefetching`, because PPR is not allowed with `output: "export"`.
- Export settings (`output: "export"`, `trailingSlash: true`) apply only to builds. In dev, rewrites proxy `/api` to :8000.
- Tests:
  - `cd backend && uv run pytest`. TestClient needs `httpx2`.
  - `cd frontend && npm test`. Vitest; component tests use a `// @vitest-environment jsdom` comment.
- The GitHub MCP token cannot merge PRs. Merge with `GH_TOKEN=$(gh auth token --user ajimenez78) gh pr merge <n> --merge`.
