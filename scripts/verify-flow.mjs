import { chromium } from 'playwright-core';

const base = 'http://localhost:4173';
const outDir = process.argv[2];
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

// 1. Shop → click first product card → product detail
await page.goto(base + '/shop', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const firstCard = page.locator('#products article').first();
const cardName = await firstCard.locator('h3').textContent();
await firstCard.click();
await page.waitForTimeout(900);
const detailH1 = await page.locator('h1').first().textContent();
console.log(`product card "${cardName?.trim()}" → detail page h1 "${detailH1?.trim()}" @ ${page.url().replace(base, '')}`);
await page.screenshot({ path: `${outDir}/product-detail.png`, fullPage: true });

// 2. Add to bag → drawer opens
await page.getByRole('button', { name: /add to bag|preorder/i }).first().click();
await page.waitForTimeout(700);
const drawerVisible = await page.locator('[role="dialog"]').isVisible();
const drawerCount = await page.locator('[role="dialog"]').locator('text=item').first().textContent().catch(() => 'n/a');
console.log(`cart drawer visible: ${drawerVisible} (${drawerCount?.trim()})`);
await page.screenshot({ path: `${outDir}/cart-drawer.png` });

// 3. Checkout button exists in drawer
const checkoutBtn = await page.locator('[role="dialog"] button', { hasText: 'Checkout' }).count();
console.log(`checkout button in drawer: ${checkoutBtn > 0}`);

// 4. Home re-check (overline fix)
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${outDir}/home-final.png`, fullPage: true });

console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.slice(0, 8).join('\n') : 'no console errors');
await browser.close();
