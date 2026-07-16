import { chromium } from 'playwright-core';

const base = 'http://localhost:4173';
const outDir = process.argv[2];
const routes = [
  ['/', 'home'],
  ['/shop', 'shop'],
  ['/new', 'new'],
  ['/category/dresses', 'category-dresses'],
  ['/category/sale', 'category-sale'],
  ['/cart', 'cart'],
  ['/wishlist', 'wishlist'],
  ['/account', 'account'],
  ['/rewards', 'rewards'],
  ['/refer', 'refer'],
  ['/help/faqs', 'help-faqs'],
  ['/help/size-guide', 'help-size-guide'],
  ['/does-not-exist', 'not-found'],
  ['/admin', 'admin-gate'],
];

const browser = await chromium.launch({ channel: 'msedge' });
let failures = 0;

for (const viewport of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 390, h: 844, tag: 'mobile' }]) {
  const page = await browser.newPage({ viewport: { width: viewport.w, height: viewport.h } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));

  for (const [route, name] of routes) {
    errors.length = 0;
    try {
      const resp = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600);
      const status = resp?.status();
      const shots = viewport.tag === 'desktop' || ['home', 'shop'].includes(name);
      if (shots) await page.screenshot({ path: `${outDir}/${name}-${viewport.tag}.png`, fullPage: true });
      const relevant = errors.filter((e) => !e.includes('favicon') && !e.includes('net::ERR') || e.includes('pageerror'));
      if (relevant.length || (status && status >= 400)) {
        failures++;
        console.log(`FAIL ${viewport.tag} ${route} status=${status}`);
        relevant.slice(0, 5).forEach((e) => console.log('   ' + e.slice(0, 300)));
      } else {
        console.log(`ok   ${viewport.tag} ${route}`);
      }
    } catch (e) {
      failures++;
      console.log(`FAIL ${viewport.tag} ${route} — ${String(e).slice(0, 200)}`);
    }
  }
  await page.close();
}

// Link audit on the homepage: every internal <a href> must resolve to a route (no 404 NotFound render)
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + '/', { waitUntil: 'networkidle' });
const hrefs = await page.$$eval('a[href]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
const internal = hrefs.filter((h) => h && h.startsWith('/') && !h.startsWith('//'));
console.log(`\nlink audit: ${internal.length} unique internal links on home`);
for (const href of internal) {
  await page.goto(base + href, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(350);
  const notFound = await page.locator('text=Page not found').count();
  const drifted = await page.locator('text=has drifted').count();
  if (notFound + drifted > 0) { failures++; console.log(`FAIL link ${href} → 404 page`); }
  else console.log(`ok   link ${href}`);
}

await browser.close();
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASS');
process.exit(failures ? 1 : 0);
