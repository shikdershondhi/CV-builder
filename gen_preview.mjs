import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const indexPath = resolve(projectRoot, 'index.html');
const manifestPath = resolve(projectRoot, 'sections/manifest.json');
const outputPath = resolve(projectRoot, 'preview-linkedin.png');

function escapeRegExp(v) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function assembleHtml() {
  const template = await readFile(indexPath, 'utf8');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  let html = template;
  for (const { slot, file } of manifest.sections) {
    const fragment = await readFile(resolve(projectRoot, file), 'utf8');
    const slotPattern = new RegExp(
      `(<div class="slot" data-slot="${escapeRegExp(slot)}">)([\\s\\S]*?)(</div>)`
    );
    html = html.replace(slotPattern, `$1${fragment}$3`);
  }
  return html;
}

const browser = await puppeteer.launch({ headless: true });

// ── Step 1: render the CV and capture just the .page element ──────────────────
const cvPage = await browser.newPage();
await cvPage.emulateMediaType('screen');
await cvPage.setViewport({ width: 1240, height: 1800, deviceScaleFactor: 2 });
await cvPage.setContent(await assembleHtml(), { waitUntil: 'networkidle0' });

// Tidy up UI chrome so only the CV card is visible
await cvPage.addStyleTag({
  content: `
    body { background: #f5f5f0 !important; padding: 0 !important; margin: 0 !important; }
    .fab-group, .tweaks, .editor-panel { display: none !important; }
    .page {
      width: 1240px !important;
      margin: 0 !important;
      box-shadow: 0 8px 48px rgba(0,0,0,0.18) !important;
    }
  `
});

const pageEl = await cvPage.$('.page');
const cvScreenshot = await pageEl.screenshot({ encoding: 'base64', type: 'png' });
await cvPage.close();

// ── Step 2: compose a LinkedIn card (1200 × 628 @2x) ─────────────────────────
const card = await browser.newPage();
await card.setViewport({ width: 1200, height: 628, deviceScaleFactor: 2 });

await card.setContent(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 1200px;
    height: 628px;
    overflow: hidden;
    background: #0f0f1a;
    font-family: 'Inter', sans-serif;
  }

  /* Background */
  .bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #0d0d1f 0%, #1a1030 45%, #120a20 100%);
  }
  .bg-dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
    background-size: 30px 30px;
  }
  /* Purple glow blob */
  .glow {
    position: absolute;
    left: 320px;
    top: -120px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Layout */
  .layout {
    position: relative;
    z-index: 2;
    display: flex;
    height: 628px;
    align-items: stretch;
  }

  /* Left panel */
  .left {
    width: 430px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 52px 48px 52px 56px;
    gap: 0;
  }

  .eyebrow {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #a78bfa;
    margin-bottom: 18px;
  }

  .title {
    font-family: 'Instrument Serif', serif;
    font-size: 50px;
    line-height: 1.08;
    color: #f0eeff;
    margin-bottom: 18px;
  }

  .title em {
    font-style: italic;
    color: #c4b5fd;
  }

  .subtitle {
    font-size: 13.5px;
    line-height: 1.65;
    color: rgba(255,255,255,0.48);
    margin-bottom: 28px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 36px;
  }

  .tag {
    font-size: 10.5px;
    font-weight: 500;
    padding: 4px 11px;
    border-radius: 20px;
    background: rgba(139,92,246,0.14);
    color: #c4b5fd;
    border: 1px solid rgba(139,92,246,0.28);
    letter-spacing: 0.02em;
  }

  .built-with {
    font-size: 10.5px;
    color: rgba(255,255,255,0.28);
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .built-with strong {
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }

  /* Divider */
  .divider {
    position: absolute;
    left: 430px;
    top: 8%;
    height: 84%;
    width: 1px;
    background: linear-gradient(to bottom,
      transparent 0%,
      rgba(139,92,246,0.35) 25%,
      rgba(139,92,246,0.35) 75%,
      transparent 100%);
    z-index: 3;
  }

  /* Right panel — CV screenshot */
  .right {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Fade masks on top/bottom of right panel */
  .right::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(to bottom, #0f0f1f, transparent);
    z-index: 4;
    pointer-events: none;
  }
  .right::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 80px;
    background: linear-gradient(to top, #0f0f1f, transparent);
    z-index: 4;
    pointer-events: none;
  }

  /* Left edge fade on right panel */
  .right-fade-left {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 60px;
    background: linear-gradient(to right, #0f0f1f, transparent);
    z-index: 4;
    pointer-events: none;
  }

  .cv-wrap {
    position: relative;
    right: -20px;
    transform-origin: top right;
    transform: scale(0.56);
    border-radius: 6px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.07),
      0 24px 80px rgba(0,0,0,0.8),
      0 4px 16px rgba(0,0,0,0.5);
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 20px;
  }

  .cv-wrap img {
    display: block;
    max-width: none;
  }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="bg-dots"></div>
  <div class="glow"></div>

  <div class="layout">
    <div class="left">
      <div class="eyebrow">Open Source &nbsp;·&nbsp; Free &nbsp;·&nbsp; No Login</div>
      <div class="title">Build your CV<br>in <em>one step.</em></div>
      <div class="subtitle">Edit, customise, and export a<br>professional PDF — all in one tab.<br>Your data stays on your machine.</div>
      <div class="tags">
        <span class="tag">5 Themes</span>
        <span class="tag">Live Preview</span>
        <span class="tag">PDF Export</span>
        <span class="tag">JSON Backup</span>
        <span class="tag">No Subscription</span>
        <span class="tag">Vanilla JS</span>
      </div>
      <div class="built-with">
        Built with <strong>Claude Code</strong> — AI co-worker &amp; autocomplete<br>
        <strong>Vercel</strong> · <strong>Puppeteer</strong> · <strong>HTML / CSS / JS</strong>
      </div>
    </div>

    <div class="divider"></div>

    <div class="right">
      <div class="right-fade-left"></div>
      <div class="cv-wrap">
        <img src="data:image/png;base64,${cvScreenshot}" width="1240">
      </div>
    </div>
  </div>
</body>
</html>`, { waitUntil: 'networkidle0' });

await card.screenshot({
  path: outputPath,
  clip: { x: 0, y: 0, width: 1200, height: 628 },
  type: 'png',
});

await browser.close();
console.log('LinkedIn preview saved:', outputPath);
