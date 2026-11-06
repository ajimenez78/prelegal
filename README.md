# prelegal

A platform for drafting common legal agreements.

> **Status: work in progress.** Expected completion: November 12, 2026.

## Features

- **Sign in**: a placeholder login screen. Any credentials are accepted for now.
- **Mutual NDA creator**: fill in the key terms in a form, see the completed
  Common Paper Mutual NDA update live, and download it as a PDF.
- **Template library**: 12 standard agreements from Common Paper (NDA, cloud
  service, DPA, BAA, SLA and more), listed in `catalog.json`.

## Repository layout

| Path | Contents |
| --- | --- |
| `frontend/` | Next.js web app (TypeScript, Tailwind CSS, Vitest) |
| `backend/` | FastAPI app (uv project, pytest) |
| `templates/` | Common Paper agreement templates in Markdown |
| `scripts/` | Start and stop scripts for Mac, Linux and Windows |
| `catalog.json` | Name, description and filename of each template |

## Running

Requires Docker. Optionally put an `OPENAI_API_KEY` in `.env` at the project
root.

```bash
scripts/start-linux.sh     # or start-mac.sh / start-windows.ps1
scripts/stop-linux.sh      # or stop-mac.sh / stop-windows.ps1
```

Open http://localhost:8000.

## Development

Requires Node.js 20 or later and [uv](https://docs.astral.sh/uv/).

```bash
cd backend && uv run uvicorn app.main:app --reload   # API on :8000
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

The NDA templates are read from `templates/` at build time, so the templates
are the single source of truth. Form values are substituted into the template
placeholders and rendered as Markdown. The PDF is produced with the browser's
print dialog. See `frontend/README.md` for details.

## License

The code is released under the [MIT License](LICENSE). The templates in
`templates/` are from [Common Paper](https://commonpaper.com/standards/) and
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see
`templates/LICENSE.txt`.
