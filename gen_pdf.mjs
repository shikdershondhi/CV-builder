import puppeteer from 'puppeteer';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const htmlPath = resolve('/Users/shikdershondhi/Downloads/meem cv/Bakir Hossain CV.html');
const pdfPath  = resolve('/Users/shikdershondhi/Downloads/meem cv/Bakir Hossain CV.pdf');

const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();

await page.emulateMediaType('screen');
// 1240px viewport: well above the 820px mobile breakpoint
await page.setViewport({ width: 1240, height: 1800, deviceScaleFactor: 1 });

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 30000 });

// Base layout + fine-tuned spacing to fill A4 naturally
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
  /* Crop photo to square so it doesn't dominate the sidebar */
  .photo { aspect-ratio: 1 / 0.9 !important; }

  /* Increase section spacing to fill A4 height naturally */
  .section          { margin-bottom: 26px !important; }
  .side-section     { margin-top: 28px !important; }
  .item             { padding: 13px 0 !important; }
  .main             { padding: 44px 44px 52px !important; }
  .sidebar          { padding: 34px 26px 52px !important; }
` });

// Measure content height; stretch to A4 only if content fits on one page
const A4_H = 1754; // A4 height in px at scale 0.64
const dims = await page.evaluate(() => ({
  contentH: document.querySelector('.page').offsetHeight,
}));
console.log('Content height after spacing:', dims);

const targetH = A4_H;

await page.evaluate((h) => {
  const p = document.querySelector('.page');
  p.style.setProperty('height', h + 'px');
  p.style.setProperty('overflow', 'visible');
  p.style.setProperty('align-content', 'stretch');
  document.querySelector('.sidebar').style.setProperty('align-self', 'stretch');
  document.querySelector('.main').style.setProperty('align-self', 'stretch');
}, targetH);

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
