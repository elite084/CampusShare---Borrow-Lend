import { test, expect, open, dialog, heading, nav, switchTo, card } from './support.mjs';

test.describe('Pages and access', () => {
  test('loads the main pages and the hostel directory from their URLs', async ({ page }) => {
    const routes = {
      browse: /Borrow more/, listings: 'My listings', requests: 'My requests', wishlist: 'Wishlist',
      wanted: 'Wanted board', notifications: 'Notifications', profile: 'Your space', hostels: 'Hostels',
      'hostels/maple/members': 'Maple Hall', 'item/calculator': 'Casio Scientific Calculator',
      'wanted/w-tripod': 'Phone tripod for a project', 'request/demo-incoming': 'Compact Electric Kettle',
    };
    for (const [route, title] of Object.entries(routes)) {
      await test.step(route, async () => {
        await open(page, route);
        await expect(heading(page)).toHaveText(title);
      });
    }
  });

  test('refuses an unrelated student access to an accepted request and its private details', async ({ page }) => {
    await open(page, 'request/demo-sent');
    await expect(page.getByText('C-103', { exact: true })).toBeVisible();
    await expect(page.getByText(/I can meet you after 5/)).toBeVisible();
    await switchTo(page, 'Maya Iyer');
    await open(page, 'request/demo-sent');
    await expect(page.getByRole('heading', { name: 'This request is unavailable' })).toBeVisible();
    await expect(page.getByText('C-103', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/I can meet you after 5/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cancel request|Mark handed over/ })).toHaveCount(0);
  });

  test('recovers from a missing item or unknown page via the marketplace link', async ({ page }) => {
    for (const [route, subject] of [['item/unknown', 'listing'], ['hostels/unknown', 'hostel'], ['unknown-page', 'page']]) {
      await open(page, route);
      await expect(page.getByRole('heading', { name: `This ${subject} is unavailable` })).toBeVisible();
      await page.getByRole('main').getByRole('link', { name: 'Browse listings' }).click();
      await expect(heading(page)).toHaveText(/Borrow more/);
    }
  });
});

test.describe('Demo accounts', () => {
  test('switches account, changes the owner view and remembers the current student on reload', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'My listings' }).click();
    await expect(card(page, 'Compact Electric Kettle')).toBeVisible();
    await switchTo(page, 'Priya Menon');
    await expect(card(page, 'Extension Boards')).toBeVisible();
    await expect(card(page, 'Compact Electric Kettle')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: /Current student Priya Menon/ })).toBeVisible();
    await expect(card(page, 'Extension Boards')).toBeVisible();
  });

  test('dismisses account switching with Escape and only resets after confirmation', async ({ page }) => {
    const switcher = page.getByRole('button', { name: /Current student Anika Rao/ });
    await switcher.click();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(switcher).toBeFocused();
    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await switchTo(page, 'Rohan Mehta');
    await page.getByRole('button', { name: /Current student Rohan Mehta/ }).click();
    await dialog(page).getByRole('button', { name: 'Reset demo' }).click();
    await dialog(page).getByRole('button', { name: 'Go back' }).click();
    await expect(dialog(page).getByRole('heading')).toHaveText('Switch demo student');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await dialog(page).getByRole('button', { name: 'Reset demo' }).click();
    await dialog(page).getByRole('button', { name: 'Reset demo' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(switcher).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(card(page, 'Extension Boards')).toHaveText(/5 of 5 free now/);
  });
});
