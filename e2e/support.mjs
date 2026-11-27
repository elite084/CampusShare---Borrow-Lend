import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export const test = base.extend({
  diagnostics: [async ({ context, baseURL }, use, testInfo) => {
    const errors = [];
    context.on('weberror', event => errors.push(event.error().stack ?? event.error().message));
    context.on('console', message => {
      if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url || 'page console'})`);
    });
    const origin = new URL(baseURL).origin;
    context.on('response', response => {
      if (new URL(response.url()).origin === origin && response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
    });
    // Keep the browser suite independent of the Google Fonts CDN. The app supplies its fallback fonts.
    await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await use();
    if (errors.length) await testInfo.attach('browser errors', { body: errors.join('\n\n'), contentType: 'text/plain' });
    expect(errors, 'No uncaught exceptions, console errors, or failed CampusShare HTTP responses').toEqual([]);
  }, { auto: true }],
  startDemo: [async ({ page, diagnostics }, use) => {
    // Leave timers running while the clock keeps the example booking dates fixed.
    await page.clock.setFixedTime(new Date('2026-11-27T10:00:00+05:30'));
    await open(page, 'browse');
    await use();
  }, { auto: true }],
});

export { expect };

export const date = (offset = 0) => new Date(Date.UTC(2026, 10, 27 + offset)).toISOString().slice(0, 10);
export const dialog = page => page.getByRole('dialog');
export const nav = page => page.getByRole('navigation', { name: 'Main navigation' });
export const heading = page => page.getByRole('main').getByRole('heading', { level: 1 });
export const card = (page, title) => page.locator('.listing-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
export const status = page => page.locator('.page-heading .badge');
export const error = page => dialog(page).getByRole('alert');
export const feedback = page => page.locator('#availability-feedback');
export const photo = fileURLToPath(new URL('../dist/assets/kettle.jpg', import.meta.url));

export async function open(page, route) {
  await page.goto(`/#${route}`);
  await expect(page.getByRole('main')).toBeVisible();
}

export async function switchTo(page, name) {
  await page.getByRole('button', { name: /^Switch demo student\. Current student/ }).click();
  await dialog(page).getByRole('button', { name: new RegExp(name) }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByRole('button', { name: `Switch demo student. Current student ${name}` })).toBeVisible();
}

export async function closeDialog(page) {
  await dialog(page).getByRole('button', { name: 'Close dialog' }).click();
  await expect(dialog(page)).toBeHidden();
}

export async function fillListing(page, { title, category = 'Kitchen', description = 'Clean and ready to share.', mode = 'Lend for free', quantity = 1, price, image } = {}) {
  await page.getByRole('banner').getByRole('button', { name: 'List an item' }).click();
  const form = dialog(page);
  await form.getByLabel('Item name').fill(title);
  await form.getByLabel('Category').selectOption({ label: category });
  await form.getByLabel('Share type').selectOption({ label: mode });
  await form.getByLabel(/^(Total units|Units in stock)$/).fill(String(quantity));
  await form.getByLabel('Description').fill(description);
  if (price !== undefined) await form.getByLabel(/^(Asking price|Price) per unit/).fill(String(price));
  if (image) await form.locator('input[type=file]').setInputFiles(image);
  return form;
}

export async function publishListing(page, options) {
  const form = await fillListing(page, options);
  await form.getByRole('button', { name: 'Publish listing' }).click();
  await expect(form).toBeHidden();
  await expect(heading(page)).toHaveText(options.title);
  return new URL(page.url()).hash.slice(1);
}

export async function fillRequest(page, { button = 'Request to borrow', quantity, start, end, offer, message = 'Could I pick this up after class?' } = {}) {
  await page.getByRole('button', { name: button, exact: true }).click();
  const form = dialog(page);
  if (quantity !== undefined) await form.getByLabel('How many?').fill(String(quantity));
  if (start) await form.getByLabel('Pickup date').fill(start);
  if (end) await form.getByLabel('Return date').fill(end);
  if (offer !== undefined) await form.getByLabel('Offer per unit (₹)').fill(String(offer));
  await form.getByLabel('Message', { exact: true }).fill(message);
  return form;
}

export async function sendRequest(page, options) {
  const form = await fillRequest(page, options);
  await form.getByRole('button', { name: /^(Send request|Send offer)$/ }).click();
  await expect(form).toBeHidden();
  await expect(status(page)).toHaveText('Requested');
  return new URL(page.url()).hash.slice(1);
}

export async function transition(page, button, next) {
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(status(page)).toHaveText(next);
}

export async function secondTab(context, route, name) {
  const page = await context.newPage();
  await open(page, 'browse');
  if (name) await switchTo(page, name);
  await open(page, route);
  return page;
}

export async function queueWrites(page, clickActions) {
  // Hold a readwrite transaction without changing any records until both real UI clicks are queued.
  await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('campusshare-demo');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('data', 'readwrite');
      const records = tx.objectStore('data');
      tx.onabort = () => reject(tx.error);
      tx.oncomplete = () => db.close();
      let released = false;
      window.releaseTestTransaction = () => { released = true; };
      function keepOpen() {
        const read = records.get('current');
        read.onsuccess = () => {
          resolve();
          if (!released) keepOpen();
        };
      }
      keepOpen();
    };
  }));
  try {
    await Promise.all(clickActions.map(click => click()));
  } finally {
    await page.evaluate(() => window.releaseTestTransaction());
  }
}
