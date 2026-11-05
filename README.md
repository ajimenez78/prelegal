# prelegal

A platform for drafting common legal agreements.

> **Status: work in progress.** Expected completion: November 12, 2026.

## Features

- **Mutual NDA creator**: fill in the key terms in a form, see the completed
  Common Paper Mutual NDA update live, and download it as a PDF.
- **Template library**: 12 standard agreements from Common Paper (NDA, cloud
  service, DPA, BAA, SLA and more), listed in `catalog.json`.

## Repository layout

| Path | Contents |
| --- | --- |
| `frontend/` | Next.js web app (TypeScript, Tailwind CSS, Vitest) |
| `templates/` | Common Paper agreement templates in Markdown |
| `catalog.json` | Name, description and filename of each template |

## Getting started

Requires Node.js 20 or later.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run unit tests |
| `npm run lint` | Lint the code |
| `npm run build` | Build for production |
| `npm start` | Serve the production build |

## How it works

The app reads the NDA templates from `templates/` at build time, so the
templates are the single source of truth and the page is statically
prerendered. Form values are substituted into the template placeholders, and
the result is rendered as Markdown. The PDF is produced with the browser's
print dialog using a print stylesheet. See `frontend/README.md` for details.

## License

The code is released under the [MIT License](LICENSE). The templates in
`templates/` are from [Common Paper](https://commonpaper.com/standards/) and
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see
`templates/LICENSE.txt`.
