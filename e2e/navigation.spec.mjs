import { test, expect, open, heading, nav, dialog, feedback, fillRequest } from './support.mjs';

test.describe('Navigation', () => {
  test('updates the active section and supports browser Back and Forward', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Wanted board' }).click();
    await expect(heading(page)).toHaveText('Wanted board');
    await expect(nav(page).getByRole('link', { name: 'Wanted board' })).toHaveAttribute('aria-current', 'page');
    await expect(nav(page).getByRole('link', { name: 'Browse' })).not.toHaveAttribute('aria-current', 'page');
    await nav(page).getByRole('link', { name: 'Hostels', exact: true }).click();
    await expect(heading(page)).toHaveText('Hostels');
    await page.goBack();
    await expect(heading(page)).toHaveText('Wanted board');
    await page.goForward();
    await expect(nav(page).getByRole('link', { name: 'Hostels', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('lets keyboard users skip the navigation and recovers from a missing destination', async ({ page }) => {
    await page.reload();
    await expect(heading(page)).toHaveText(/Borrow more/);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page).toHaveURL(/#browse$/);
    await open(page, 'wanted/unknown');
    await expect(page.getByRole('heading', { name: 'This wanted post is unavailable' })).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: 'Browse listings' }).click();
    await expect(nav(page).getByRole('link', { name: 'Browse' })).toHaveAttribute('aria-current', 'page');
  });
});

async function fitsViewport(page) {
  const expectedWidth = page.viewportSize().width;
  const dimensions = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    dialog: document.querySelector('dialog[open]')?.scrollWidth ?? 0,
    dialogWidth: document.querySelector('dialog[open]')?.clientWidth ?? 0,
  }));
  expect(dimensions.viewport).toBe(expectedWidth);
  expect(dimensions.page).toBeLessThanOrEqual(expectedWidth);
  expect(dimensions.dialog).toBeLessThanOrEqual(dimensions.dialogWidth);
}

for (const width of [320, 390]) {
  test.describe(`Phone layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });

    test('shows persistent touch navigation, fits pages and dialogs, and blocks invalid stock on mobile', async ({ page }) => {
      const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
      await expect(mobile).toBeInViewport({ ratio: 1 });
      await expect(nav(page)).toBeHidden();
      await fitsViewport(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(mobile).toBeInViewport({ ratio: 1 });
      await mobile.getByRole('link', { name: 'You', exact: true }).tap();
      await expect(heading(page)).toHaveText('Your space');
      await mobile.getByRole('link', { name: 'Requests', exact: true }).tap();
      await expect(heading(page)).toHaveText('My requests');
      await fitsViewport(page);
      await mobile.getByRole('button', { name: 'List item', exact: true }).tap();
      await expect(dialog(page).getByRole('heading')).toHaveText('List an item');
      await fitsViewport(page);
      await dialog(page).getByRole('button', { name: 'Close dialog' }).tap();
      await open(page, 'item/extension-boards');
      const form = await fillRequest(page, { button: 'Request to rent', quantity: 6 });
      await expect(feedback(page)).toContainText('Only 5 units left');
      await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
      await fitsViewport(page);
      await form.getByLabel('How many?').fill('1');
      await expect(form.getByRole('button', { name: 'Send request' })).toBeEnabled();
    });
  });
}
