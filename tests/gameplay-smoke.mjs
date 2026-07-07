import { chromium } from 'playwright-core';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem('pink-halo-guest', 'true'));
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => pageErrors.push(error.message));

await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await page.locator('.world-welcome-card button').click();
await page.locator('.world-status').waitFor({ state: 'visible' });
const canvas = page.locator('.world-shell canvas');
await canvas.waitFor({ state: 'visible' });
const gameplayCanvasCount = await page.locator('.world-shell canvas').count();
const box = await canvas.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 25, { steps: 4 });
  await page.mouse.up();
}
await canvas.click({ position: { x: 20, y: 20 } });
let pointerLockedAfterCanvasClick = false;
try {
  await page.waitForFunction(() => Boolean(document.pointerLockElement), { timeout: 2500 });
  pointerLockedAfterCanvasClick = await page.evaluate(() => Boolean(document.pointerLockElement));
} catch {
  pointerLockedAfterCanvasClick = await page.evaluate(() => Boolean(document.pointerLockElement));
}
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
if (await page.evaluate(() => Boolean(document.pointerLockElement))) {
  await page.evaluate(() => document.exitPointerLock());
}
await page.keyboard.down('KeyW');
await page.waitForTimeout(1100);
await page.keyboard.up('KeyW');
const desktopControlsHidden = await page.locator('.world-touch-controls').evaluate(element => getComputedStyle(element).display === 'none');
await page.getByRole('button', { name: 'Menu' }).click();
const menu = page.getByRole('dialog', { name: 'Store menu' });
await menu.waitFor();
await menu.getByRole('button', { name: 'Close', exact: true }).click();
await page.keyboard.press('Escape');
await page.waitForTimeout(80);
await page.getByRole('button', { name: 'Bag', exact: true }).click({ force: true });
await page.getByRole('dialog', { name: 'Shopping bag' }).waitFor();
await page.getByText('Your bag is empty', { exact: true }).waitFor();
await page.getByRole('button', { name: 'Continue exploring' }).click();
await page.getByRole('button', { name: 'Menu' }).click();
await menu.waitFor();
await menu.getByRole('button', { name: /Exit/ }).click();
await page.getByRole('alertdialog', { name: 'Confirm exit' }).waitFor();
await page.getByRole('button', { name: 'Stay in store' }).click();
await menu.waitFor();
await menu.getByRole('button', { name: 'Close', exact: true }).click();
await page.keyboard.press('Escape');
await page.waitForTimeout(80);
await page.getByRole('button', { name: 'Bag', exact: true }).click({ force: true });
await page.getByRole('dialog', { name: 'Shopping bag' }).waitFor();
const cursorState = await page.evaluate(() => ({
  html: getComputedStyle(document.documentElement).cursor,
  body: getComputedStyle(document.body).cursor,
  canvas: getComputedStyle(document.querySelector('canvas')).cursor,
  pointerLocked: Boolean(document.pointerLockElement),
}));
await page.getByRole('dialog', { name: 'Shopping bag' }).getByRole('button', { name: /Back to store/ }).click();
let donationRequest = null;
await page.route('**/api/create-checkout-session', async route => {
  donationRequest = route.request().postDataJSON();
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: `${baseUrl}/?checkout=donation-success`, sessionId: 'test_donation' }) });
});
await page.getByRole('button', { name: 'Menu' }).click();
await page.getByRole('dialog', { name: 'Store menu' }).getByRole('button', { name: /Donate/ }).click();
const donationDialog = page.getByRole('dialog', { name: 'Donation piggy bank' });
await donationDialog.getByRole('button', { name: '$25.00', exact: true }).click();
await donationDialog.getByRole('button', { name: 'Donate $25.00' }).click();
await page.waitForURL('**/?checkout=donation-success');
const donationFlow = donationRequest?.checkoutType === 'donation' && donationRequest?.donationAmount === 2500;
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await mobilePage.locator('.world-welcome-card button').click();
await mobilePage.locator('.world-touch-controls').waitFor({ state: 'visible' });
const mobileControls = await mobilePage.locator('.world-touch-controls button').allTextContents();
await mobileContext.close();
const fallbackContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await fallbackContext.addInitScript(() => sessionStorage.setItem('pink-halo-guest', 'true'));
const fallbackPage = await fallbackContext.newPage();
await fallbackPage.route('**/*.glb', route => route.abort());
await fallbackPage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await fallbackPage.locator('.world-welcome-card button').click();
await fallbackPage.locator('.world-shell canvas').waitFor({ state: 'visible' });
const opensWithoutModels = await fallbackPage.locator('.world-shell canvas').count() === 1;
await fallbackContext.close();
const onboardingContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const onboardingPage = await onboardingContext.newPage();
await onboardingPage.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
await onboardingPage.locator('.world-welcome-card button').click();
const authChoice = onboardingPage.getByRole('dialog', { name: 'Choose how to continue' });
await authChoice.waitFor({ state: 'visible' });
const pointerUnlockedForAuth = await onboardingPage.evaluate(() => !document.pointerLockElement);
await authChoice.getByRole('button', { name: 'Continue as guest' }).click();
await onboardingContext.close();

console.log(JSON.stringify({
  url: page.url(),
  gameplayCanvasCount,
  pointerLockedAfterCanvasClick,
  pointerUnlockedForAuth,
  desktopControlsHidden,
  mobileControls,
  opensWithoutModels,
  donationFlow,
  cursorState,
  consoleErrors,
  pageErrors,
}, null, 2));
await browser.close();
