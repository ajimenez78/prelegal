# Prelegal frontend

The Prelegal web app. `/` is a placeholder sign in screen that posts to the
backend's `/api/login` stub and continues to `/draft`. There, users chat with
the AI assistant (`/api/chat`) to choose and fill in a Common Paper agreement,
watch it update alongside the chat, and use **Download PDF** to save it via the
browser's print dialog.

## Development

```bash
npm install
npm run dev     # http://localhost:3000, proxies /api to the backend on :8000
npm test        # Vitest unit and component tests
npm run lint
npm run build
```

## How it works

- `npm run build` produces a static export in `out/`, which the backend serves
  in production (see the root `Dockerfile`).
- `src/lib/templates.ts` reads `../catalog.json` and `../templates/` from the
  repository root at build time, so they stay the single source of truth and
  the page is statically prerendered. The app therefore expects to run from
  inside this repository.
- `src/lib/documents.ts` builds each supported document and extracts the key
  terms its template references. `src/lib/keyterms.ts` renders them as a
  generated Key Terms cover page.
- `src/lib/nda.ts` fills the Mutual NDA cover page placeholders. Each
  replacement fails loudly if its placeholder is missing, so template changes
  are caught by the tests in `src/lib/nda.test.ts`, which run against the real
  template files.
- User input is never rendered as HTML: values are emitted as markdown inline
  code spans, which `src/components/DocumentPreview.tsx` renders as "filled field"
  elements.
- The print stylesheet in `src/app/globals.css` hides the chat and lays the
  document out for paper.

Templates are © Common Paper, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
