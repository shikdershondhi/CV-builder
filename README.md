# CV Sample Project

This project is now organized around `index.html` as the shell that manages the page, with the CV content split into section files under `sections/`.

## Workflow

1. Run `npm run dev` and open the served page in a browser so the section loader can fetch the fragment files.
2. Edit the section fragments in `sections/cv/` or the tweak panel markup in `sections/ui/`.
3. Use the current PDF function from the page shell.
4. Deploy to Vercel; the root route (`/`) rewrites to `index.html`.

## Commands

- `npm run dev`: Serve the project locally for browser testing.
- `npm run preview`: Same as dev, useful before deploy.
- `npm run pdf`: Run the PDF export script against the local sectioned shell.

## Vercel behavior

- Config file: `vercel.json`
- Root URL rewrites to `index.html`
- `CV Sample.html` is kept only as a legacy fallback path
- Temporary and non-production folders are excluded via `.vercelignore`

## Notes

- `sections/manifest.json` defines the section files that the shell loads.
