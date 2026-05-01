import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const indexPath = resolve(projectRoot, 'index.html');
const manifestPath = resolve(projectRoot, 'sections/manifest.json');

// Detect format from CLI arg: node gen_pdf.mjs [standard|europass]
const formatArg = process.argv[2] || 'standard';
const isEuropass = formatArg === 'europass';
const pdfPath = resolve(projectRoot, isEuropass ? 'CV Sample Europass.pdf' : 'CV Sample.pdf');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  // Auto-activate Europass format if requested
  if (isEuropass) {
    html = html.replace(
      /html\.setAttribute\('data-format', state\.format \|\| 'standard'\);/,
      `html.setAttribute('data-format', 'europass');`
    );
    // Also set attribute on the html element directly in the static markup
    html = html.replace('<html lang="en">', '<html lang="en" data-format="europass" data-template="europass">');
  }

  return html;
}

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.emulateMediaType('screen');
await page.setViewport({ width: 1240, height: 1800, deviceScaleFactor: 1 });

await page.setContent(await assembleHtml(), { waitUntil: 'networkidle0' });

if (isEuropass) {
  // ── Europass: multi-page, auto-height ──
  await page.addStyleTag({ content: `
    body  { padding:0!important; margin:0!important; background:white!important; }
    .tweaks, #style-fab, #edit-fab, #ed-pdf, #github-fab, .ed-panel, .ed-overlay { display:none!important; }
    .sidebar { display:none!important; }
    .main    { display:none!important; }
    .ep-main { display:block!important; }
    .page {
      width: 1240px !important;
      margin: 0 !important;
      box-shadow: none !important;
      grid-template-columns: 1fr !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .ep-main { padding: 28px 36px 40px !important; }
  ` });

  const contentH = await page.evaluate(() => document.querySelector('.ep-main').scrollHeight);
  console.log('Europass content height:', contentH);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
    scale: 0.72,
  });
} else {
  // ── Standard: single-page, forced A4 height ──
  await page.addStyleTag({ content: `
    body  { padding:0!important; margin:0!important; background:white!important; }
    .tweaks { display:none!important; }
    .ep-main { display:none!important; }
    .page {
      width: 1240px !important;
      margin: 0 !important;
      box-shadow: none !important;
      display: grid !important;
      grid-template-columns: 34% 1fr !important;
      align-items: stretch !important;
    }
    .photo { aspect-ratio: 1 / 0.9 !important; }
    .section          { margin-bottom: 26px !important; }
    .side-section     { margin-top: 28px !important; }
    .main             { padding: 44px 44px 52px !important; }
    .sidebar          { padding: 34px 26px 52px !important; }
  ` });

  const A4_H = 1754;
  const dims = await page.evaluate(() => ({
    contentH: document.querySelector('.page').offsetHeight,
  }));
  console.log('Content height after spacing:', dims);

  await page.evaluate((h) => {
    const p = document.querySelector('.page');
    p.style.setProperty('height', h + 'px');
    p.style.setProperty('overflow', 'visible');
    p.style.setProperty('align-content', 'stretch');
    document.querySelector('.sidebar').style.setProperty('align-self', 'stretch');
    document.querySelector('.main').style.setProperty('align-self', 'stretch');
  }, A4_H);

  const after = await page.evaluate(() => ({
    page: document.querySelector('.page').offsetHeight,
    sidebar: document.querySelector('.sidebar').offsetHeight,
  }));
  console.log('After height fix:', after);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 0.64,
  });
}

await browser.close();
console.log('PDF generated:', pdfPath);
