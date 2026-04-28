# CV Builder — Project Rules

## Project
Next.js CV/resume builder with PDF export via Puppeteer. Deployed on Vercel.

## Stack
- Next.js (App Router)
- Puppeteer (PDF/image generation)
- Vercel Analytics

## Key conventions
- Keep components in `src/` or `app/` — follow existing structure
- Bullet points in job/education notes normalized (no mixed list styles)
- Button IDs follow kebab-case pattern established in codebase

## What to avoid
- No mock DB in tests — use real data
- No backwards-compat shims for removed code
- No comments explaining WHAT code does — only WHY when non-obvious
