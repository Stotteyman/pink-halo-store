import { chromium } from 'playwright-core';

const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
});
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await browser.close();
