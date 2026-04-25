# CV Builder — One-Step Professional CV Creator

A browser-based CV/resume builder that lets you create, style, and export a polished, print-ready CV entirely in one place — no account, no subscription, no design skills required.

Built with vanilla HTML, CSS, and JavaScript. Deployed on Vercel. Developed with the help of **Claude Code** (Anthropic's AI coding CLI), used as an AI co-worker with intelligent autocomplete throughout the entire build.

---

## Background

This project started from a frustration shared by many: existing CV builders either lock your data behind a login, charge for PDF export, or produce generic-looking output that looks like everyone else's. The goal was a fast, offline-capable, fully customizable CV tool that works in one browser tab — where you own your data as a plain JSON file.

---

## Features

### Editing

- Live in-browser editor with instant preview — no page reloads
- Accordion-style editing panel for all CV sections
- Add, edit, and remove entries for work experience, education, training, and more
- Bullet point normalization for consistent formatting
- Unsaved changes warning to prevent accidental data loss

### Sections Supported

- Header (name, job title)
- Career Objective / Profile Summary (with drop-cap styling)
- Work Experience (with bullet points per role)
- Education (with GPA/grade and achievement notes)
- Training & Certifications
- Transferable Strengths (grid layout)
- Technical Skills (with visual progress bars)
- Languages (with proficiency levels)
- Interests (chip-style display)
- References
- Contact Details (email, phone, address, LinkedIn)
- Personal Details (DOB, nationality, marital status, religion)
- Profile Photo (upload, preview, remove)
- Footer (custom text, page notes)

### Customization (Live Tweaks Panel)

- 5 Themes: Modern, Classic, Editorial, Minimal, Bold — each with distinct font pairings
- 5 Accent Colors: Terracotta, Olive, Navy, Plum, Ink
- 5 Sidebar Color Palettes: Charcoal, Slate Blue, Forest, Wine, Sand
- Font size: Small / Medium / Large
- Sidebar position: Left or Right
- Photo visibility toggle

### Export & Import

- Export CV as PDF (A4, print-optimized via Puppeteer)
- Save all CV data to a `.cvdata.json` file — portable and version-controllable
- Load a previously saved JSON file to restore full CV state including theme settings

---

## Pros

- No login, no account, no cloud lock-in — your data stays local
- Instant live preview as you type
- Clean, professional A4 output optimized for printing and PDF
- Fully portable data format (JSON) — back it up, version it with git, share it
- Zero frontend dependencies — pure HTML/CSS/JS, loads fast
- Multiple themes and color schemes to match your personal style
- Works offline after the initial page load

---

## Limitations

- Single-page CV only — multi-page layouts are not supported yet
- No collaborative editing or sharing via URL
- PDF generation requires Node.js + Puppeteer running locally (`npm run pdf`)
- Photo is stored as a base64 data URL — large images will bloat the JSON file
- No undo/redo history within the editor
- Template variety is limited to the 5 built-in themes
- Mobile editing is functional but not optimized for small screens

---

## Getting Started in One Step

1. **Open the app** — run `npm run dev` or visit the deployed Vercel URL
2. **Click "Edit CV"** — the editor panel slides in from the left
3. **Fill in your details** — work through each accordion section top to bottom
4. **Upload your photo** — optional, but adds a polished touch
5. **Tweak the style** — click the palette icon (bottom-right) to pick a theme, colors, and layout
6. **Save your data** — click "Download CV Data" to save a `.cvdata.json` backup
7. **Export as PDF** — run `npm run pdf` or use the browser's print dialog (Ctrl/Cmd+P)

That's it. One tab, one session, one download.

---

## Setup

### Prerequisites

- Node.js v18+

### Install & Run

```bash
git clone https://github.com/your-username/CV-builder.git
cd CV-builder
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Export PDF

With the dev server running and your CV visible in the browser:

```bash
npm run pdf
```

---

## Commands

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start local dev server         |
| `npm run preview` | Preview before deploying       |
| `npm run pdf`     | Export CV as PDF via Puppeteer |

---

## Project Structure

```text
CV-builder/
├── index.html              # App shell — layout, styles, JS bootstrap
├── gen_pdf.mjs             # Puppeteer PDF export script
├── package.json
├── vercel.json             # Vercel deployment config
└── sections/
    ├── manifest.json       # Defines section load order
    ├── cv/                 # CV content fragments (HTML)
    │   ├── header.html
    │   ├── sidebar.html
    │   ├── objective.html
    │   ├── work-experience.html
    │   ├── education.html
    │   ├── training.html
    │   ├── strengths.html
    │   └── footer.html
    └── ui/                 # Editor and tweaks panel
        ├── editor.html
        ├── editor.js
        ├── editor.css
        └── tweaks.html
```

---

## Deployment

Hosted on **Vercel**. The `vercel.json` rewrites all routes to `index.html`. Push to main to deploy.

---

## Built With

- HTML5 / CSS3 / Vanilla JavaScript
- [Puppeteer](https://pptr.dev/) — headless Chrome PDF generation
- [Google Fonts](https://fonts.google.com/) — Inter, Playfair Display, Instrument Serif, JetBrains Mono, DM Serif Display
- [Vercel](https://vercel.com/) — hosting and deployment

### AI-Assisted Development

This project was built using **Claude Code** — Anthropic's official AI coding CLI — as an AI co-worker throughout the entire development process. Claude Code's context-aware autocomplete and inline suggestions accelerated everything from component scaffolding and CSS theming to JavaScript state management and PDF export logic. The workflow was a genuine human-AI collaboration: the developer directed, and Claude Code suggested, wrote, and refined code in real time — making it possible to ship a fully featured app significantly faster than building alone.

---

## License

MIT
