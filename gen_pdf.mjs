import puppeteer from 'puppeteer';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const indexPath = resolve(projectRoot, 'index.html');
const manifestPath = resolve(projectRoot, 'sections/manifest.json');
const pdfPath = resolve(projectRoot, 'CV Sample.pdf');

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

  return html;
}

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.emulateMediaType('screen');
await page.setViewport({ width: 1240, height: 1800, deviceScaleFactor: 1 });

await page.setContent(await assembleHtml(), { waitUntil: 'networkidle0' });

await page.addStyleTag({ content: `
  body  { padding:0!important; margin:0!important; background:white!important; }
  .tweaks { display:none!important; }
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

await browser.close();
console.log('PDF generated:', pdfPath);
