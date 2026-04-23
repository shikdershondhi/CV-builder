# CV Sample Project

This project is designed around `CV Sample.html` as the single source of truth.

## Workflow

1. Open `CV Sample.html` in a browser.
2. Edit your CV content using the built-in editor panel.
3. Use the current PDF function exactly as implemented in the page.
4. Deploy to Vercel; the root route (`/`) rewrites to `CV Sample.html`.

## Commands

- `npm run dev`: Serve the project locally for browser testing.
- `npm run preview`: Same as dev, useful before deploy.
- `npm run pdf`: Run the existing `gen_pdf.mjs` script without changing generator logic.

## Vercel behavior

- Config file: `vercel.json`
- Root URL rewrites to `CV Sample.html`
- `index.html` also forwards to `CV Sample.html` as a static-host fallback
- Temporary and non-production folders are excluded via `.vercelignore`

## Notes

- `gen_pdf.mjs` is kept unchanged.
