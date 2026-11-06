# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

All 11 document types in the catalog are supported, drafted through an AI chat. See "Current status" below.

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

Jira: PL-2 to PL-7 are implemented. PL-7, "Support multiple users & final polish", is the last ticket.

Implemented so far (PL-2 to PL-7):
- `templates/` and `catalog.json`: the 12 Common Paper templates.
- Single Docker container (multi-stage `Dockerfile`): FastAPI on port 8000 serves `/api` and the Next.js static export at `/`.
- Backend (`backend/app/`):
  - `main.py`: app factory, lifespan and static mount, which is registered last so `/api` routes win.
  - `db.py`: stdlib `sqlite3`. A fresh DB with `users`, `sessions` and `documents` tables is created on every start, at `DB_PATH`, default `prelegal.db`. `get_db` yields one connection per request.
  - `deps.py`: `Db` (the connection, committed before the response is sent), `User` (`current_user`, 401 without a session) and `Session` (the cookie).
  - `passwords.py`: stdlib scrypt with a random salt.
  - `routers/auth.py`: `POST /api/signup` (password of 8+ characters, 409 for a taken email), `POST /api/login`, `POST /api/logout` and `GET /api/me`. A random token in `sessions` is sent as an HttpOnly `session` cookie.
  - `routers/documents.py`: `GET`/`POST /api/documents` and `GET`/`PUT /api/documents/{id}`, scoped to the signed-in user (404 for anyone else's). The draft and the chat messages are stored as JSON the backend does not read. `updatedAt` is ISO 8601 UTC with milliseconds.
  - `routers/chat.py`: stateless `POST /api/chat`, which requires a session. The request carries the messages, `documentType` (an id or null), the flat NDA `fields`, the other documents' `terms` as `{term, value}` pairs, and `documents`, the catalog summaries the browser sends. It calls `client.responses.parse(model="gpt-6-luna", text_format=ChatReply)` and returns `{reply, documentType, updates, terms}`.
    - The AI first identifies the document. For an unsupported request it names the closest supported one and waits for the user to agree.
  - `GET /api/health`.
- Frontend:
  - Sign in at `/` and sign up at `/signup/`, both `LoginForm.tsx` with a `mode`. Both go to `/documents/` (`DocumentList.tsx`), the user's saved documents.
  - `lib/api.ts`: the `api()` fetch helper and the `SavedSummary`/`SavedDocument` types. `lib/auth.ts`: `useRequireUser`, which redirects to `/` without a session.
  - `AppHeader.tsx` is the signed-in header (email, sign out) on `/documents/` and the builder.
  - `/draft/` is a new document and `/draft/?id=N` a saved one. `DraftLoader.tsx` reads the id and loads it into the builder.
  - `DocumentBuilder.tsx` autosaves the draft and the chat after each AI reply once a document is chosen: POST first, then PUT. `DocumentChat` awaits `onReply`, so the next message waits for the save. The list title is the company names (`savedTitle`).
  - The "draft, subject to legal review" disclaimer is a banner in the builder (hidden in print) and a note at the top of `DocumentPreview` (printed).
  - `DocumentBuilder.tsx` puts the AI chat (`DocumentChat.tsx`) on the left and a live preview (`DocumentPreview.tsx`) on the right. The preview is empty until a document is chosen.
  - Document ids are the template filename without `.md`, e.g. `CSA` or `Mutual-NDA`.
  - `lib/templates.ts` reads `../catalog.json` and `../templates` at build time.
  - `lib/documents.ts` turns each catalog entry into a `DocumentInfo`. Party roles default to Provider and Customer. The `ROLES` map lists only the exceptions. Key terms are extracted from the template's `<span class="*_link">` references.
  - The Mutual NDA keeps its real cover page (`lib/nda.ts`). The other 10 documents get a generated Key Terms cover page and signature table (`lib/keyterms.ts`).
  - `lib/chat.ts`:
    - `applyReply` applies each AI reply to the `Draft`. Switching documents starts the new document empty.
    - It also maps `NdaFormData` to and from the flat `party1Company`-style fields.
    - `ChatContext` types what the chat sends with each message.
  - `chatTerms` (`lib/documents.ts`) is the list the AI collects for each document: its key terms, then each party's signer name, signer title and notice address.
  - Download PDF uses the browser print dialog. The print CSS hides the chat, and the file is named from the document and the company names (`fileTitle`).
  - Preview CSS classes are `.document-*`, for example `.document-field` for a filled value.
  - Pearl tokens are in `globals.css`.
- The start and stop scripts in `scripts/` are done. The `.env` file is passed with `--env-file` at run time.

Not done yet: no further Jira tickets. Known limits: sessions never expire, the cookie has no `Secure` flag (the app runs on http://localhost), and there is no rate limiting.

Gotchas:
- `next.config.ts` cannot use `cacheComponents` or `partialPrefetching`, because PPR is not allowed with `output: "export"`.
- Export settings (`output: "export"`, `trailingSlash: true`) apply only to builds. In dev, rewrites proxy `/api` to :8000.
- Tests:
  - `cd backend && uv run pytest`. TestClient needs `httpx2`. Chat tests override the `get_client` dependency with a fake, so no API key is needed. The `signed_in` fixture signs up a user on the test client.
  - `cd frontend && npm test`. Vitest; component tests use a `// @vitest-environment jsdom` comment.
  - `vitest.config.ts` resolves the `@/` alias from tsconfig, so components importing `@/...` can be tested.
  - Next's `<Link>` drops the trailing slash in tests, because `trailingSlash` is set only for builds.
  - jsdom has no `Element.scrollTo`. The chat log scrolls by setting `scrollTop`.
- `/api/chat` needs `OPENAI_API_KEY`. For a local backend, use `uv run --env-file ../.env uvicorn app.main:app --reload`.
- The NDA fields are defined twice, in `ChatFields` (`lib/chat.ts`) and in `NdaFields`/`NdaUpdates` (`routers/chat.py`). Keep them in sync.
- A new template whose parties are not Provider and Customer needs a `ROLES` entry in `lib/documents.ts`. A test checks that every role appears in its template.
- `htmlToMarkdown` renders every `<span>` in a template as bold. That covers term references and clause headings.
- The model may not echo ids exactly. It dropped the `.md` from `CSA.md`, which is why ids have no extension. The builder only sends back a `documentType` it recognizes.
- A FastAPI `yield` dependency defaults to `scope="request"`, so its teardown runs after the response is sent. `Db` uses `scope="function"`, so writes commit first.
- Saved documents open with `?id=`, because the static export has no dynamic routes. `useSearchParams` needs the `<Suspense>` in `app/draft/page.tsx`.
- The DB is recreated on every start, so after a restart the browser's session cookie is stale and the user signs in again.
- After renaming or moving a route, run `rm -rf frontend/.next` before `tsc`. Otherwise stale generated types fail the typecheck.
- The GitHub MCP token cannot merge PRs. Merge with `GH_TOKEN=$(gh auth token --user ajimenez78) gh pr merge <n> --merge`.
