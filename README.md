# prelegal

A platform for drafting common legal agreements.

Prelegal is for founders, sales teams and anyone who needs a standard business
agreement without starting from a blank page. You fill in the key terms, and
Prelegal produces a complete agreement based on the open
[Common Paper](https://commonpaper.com/standards/) standards, ready to sign.

> **Status: work in progress.** Expected completion: November 12, 2026.

## Features

- **Sign in**: a placeholder login screen. Any credentials are accepted for now.
- **AI drafting chat**: tell the assistant what you need. It picks the right
  agreement, asks for the parties and key terms, updates the document live, and
  you download it as a PDF.
- **Template library**: 12 standard agreements from Common Paper, listed in
  `catalog.json`.

### Agreement types

All available: Mutual Non-Disclosure Agreement, Cloud Service Agreement,
Service Level Agreement, AI Addendum, Data Processing Agreement, Business
Associate Agreement, Professional Services Agreement, Software License
Agreement, Pilot Agreement, Design Partner Agreement and Partnership Agreement.

## Repository layout

| Path | Contents |
| --- | --- |
| `frontend/` | Next.js web app (TypeScript, Tailwind CSS, Vitest) |
| `backend/` | FastAPI app (uv project, pytest) |
| `templates/` | Common Paper agreement templates in Markdown |
| `scripts/` | Start and stop scripts for Mac, Linux and Windows |
| `catalog.json` | Name, description and filename of each template |

## Running

Requires Docker and an `OPENAI_API_KEY` in `.env` at the project root, which
the AI chat uses.

```bash
scripts/start-linux.sh     # or start-mac.sh / start-windows.ps1
scripts/stop-linux.sh      # or stop-mac.sh / stop-windows.ps1
```

Open http://localhost:8000.

## Usage

1. Sign in with any email and password.
2. Tell the assistant which agreement you need: any of the 11 Common Paper
   documents in `catalog.json`. If it can't draft what you ask for, it offers the
   closest one it can. It then asks for the parties and key terms, and fills
   in the agreement on the right as you answer.
3. Click **Download PDF** and save it from the print dialog. Leave the
   signature fields blank for each party to sign.

## Development

Requires Node.js 20 or later and [uv](https://docs.astral.sh/uv/).

```bash
cd backend && uv run --env-file ../.env uvicorn app.main:app --reload   # API on :8000
cd frontend && npm install && npm run dev            # site on :3000
```

The Next dev server proxies `/api` to the backend.

| Command | Purpose |
| --- | --- |
| `cd backend && uv run pytest` | Backend tests |
| `cd frontend && npm test` | Frontend tests |
| `cd frontend && npm run lint` | Lint the frontend |

## How it works

A single Docker container runs the FastAPI backend on port 8000. It serves the
API under `/api` and the Next.js site, built as a static export, at `/`. A
fresh SQLite database with a `users` table is created on every start.

`catalog.json` and `templates/` are read at build time, so they are the single
source of truth. The Mutual NDA fills its cover page template. The other
agreements get a generated Key Terms page, built from the terms each template
references, followed by their standard terms. The PDF is produced with the browser's
print dialog. See `frontend/README.md` for details.

## Contributing

1. Pick or open a ticket, then branch from `main` as
   `feature/<ticket>-<short-name>` (or `docs/` and `chore/` for other work).
2. Keep changes small and add tests for new behavior.
3. Before opening a pull request, run the backend tests, the frontend tests
   and the linter (see Development), and check the app with the start script.
4. Write commit messages in the imperative, ending with the ticket key, for
   example `Add Mutual NDA creator (PL-3)`.

## License

The code is released under the [MIT License](LICENSE). The templates in
`templates/` are from [Common Paper](https://commonpaper.com/standards/) and
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see
`templates/LICENSE.txt`.
