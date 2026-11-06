# Prelegal frontend

The Prelegal web app. `/` is a placeholder sign in screen that posts to the
backend's `/api/login` stub and continues to `/nda`, where users fill in a Common
Paper Mutual NDA, watch it update alongside the form, and use **Download PDF**
to save it via the browser's print dialog.

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
- `src/lib/templates.ts` reads `../templates/Mutual-NDA-coverpage.md` and
  `../templates/Mutual-NDA.md` from the repository root at build time, so the
  templates stay the single source of truth and the page is statically
  prerendered. The app therefore expects to run from inside this repository.
- `src/lib/nda.ts` fills the cover page placeholders with the form data. Each
  replacement fails loudly if its placeholder is missing, so template changes
  are caught by the tests in `src/lib/nda.test.ts`, which run against the real
  template files.
- User input is never rendered as HTML: values are emitted as markdown inline
  code spans, which `src/components/NdaDocument.tsx` renders as "filled field"
  elements.
- The print stylesheet in `src/app/globals.css` hides the form and lays the
  document out for paper.

Templates are © Common Paper, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
