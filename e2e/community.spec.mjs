import { test, expect, open, date, dialog, heading, status, nav, card, switchTo, closeDialog, secondTab, error } from './support.mjs';

test.describe('Wanted board', () => {
  test('posts a wanted item, accepts another student’s offer, and notifies them', async ({ page }) => {
    await nav(page).getByRole('link', { name: 'Wanted board' }).click();
    await page.getByRole('button', { name: 'Post a wanted' }).click();
    const form = dialog(page);
    await form.getByLabel('What are you looking for?').fill('Drawing Compass for Studio');
    await form.getByLabel('Category').selectOption({ label: 'Academics' });
    await form.getByLabel('Needed by').fill(date(-1));
    expect(await form.getByLabel('Needed by').evaluate(input => input.validity.rangeUnderflow)).toBe(true);
    await form.getByLabel('Details').fill('Need one compass for my next studio class.');
    await form.getByRole('button', { name: 'Publish wanted post' }).click();
    await expect(form).toBeVisible();
    await form.getByLabel('Needed by').fill(date(3));
    await form.getByRole('button', { name: 'Publish wanted post' }).click();
    await expect(heading(page)).toHaveText('Drawing Compass for Studio');
    await expect(status(page)).toHaveText('Open');
    await expect(page.getByRole('button', { name: 'Offer to help' })).toHaveCount(0);
    await switchTo(page, 'Maya Iyer');
    await expect(page.getByRole('button', { name: 'Mark fulfilled' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Offer to help' }).click();
    await form.getByLabel('Pickup spot').selectOption({ label: 'Student centre' });
    await form.getByLabel('Message').fill('I can bring a spare compass.');
    await form.getByRole('button', { name: 'Send offer' }).click();
    await expect(page.getByText('I can bring a spare compass.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Offer to help' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Accept offer' })).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await page.getByRole('button', { name: 'Accept offer' }).click();
    await expect(status(page)).toHaveText('Fulfilled');
    await expect(page.getByText('Student centre', { exact: true })).toBeVisible();
    await switchTo(page, 'Maya Iyer');
    await open(page, 'notifications');
    await page.getByRole('button', { name: /Anika accepted your offer/ }).click();
    await expect(status(page)).toHaveText('Fulfilled');
    await expect(page.getByRole('button', { name: 'Offer to help' })).toHaveCount(0);
  });

  test('refuses a stale duplicate offer and hides a student’s offer from other visitors', async ({ page, context }) => {
    await open(page, 'wanted/w-tripod');
    const stale = await secondTab(context, 'wanted/w-tripod', 'Anika Rao');
    for (const tab of [page, stale]) {
      await tab.getByRole('button', { name: 'Offer to help' }).click();
      await dialog(tab).getByLabel('Message').fill('A tripod is available at the main canteen.');
    }
    await dialog(page).getByRole('button', { name: 'Send offer' }).click();
    await expect(page.getByText(/A tripod is available/)).toBeVisible();
    await dialog(stale).getByRole('button', { name: 'Send offer' }).click();
    await expect(error(stale)).toContainText('cannot receive another offer from you');
    await closeDialog(stale);
    await switchTo(page, 'Maya Iyer');
    await expect(page.getByText(/A tripod is available/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Offer to help' })).toBeVisible();
    await switchTo(page, 'Rohan Mehta');
    await expect(page.getByText(/A tripod is available/)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Accept offer' })).toHaveCount(1);
  });
});

test.describe('Profiles and wishlist', () => {
  test('shows the active profile and remembers the selected theme on refresh', async ({ page }) => {
    await open(page, 'profile');
    await expect(page.locator('.profile-panel')).toContainText('Anika Rao');
    await expect(page.locator('.profile-panel')).toContainText('Maple Hall');
    await page.getByRole('main').getByRole('button', { name: 'Dark theme', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await switchTo(page, 'Zoya Khan');
    await expect(page.locator('.profile-panel')).toContainText('Cedar House');
    await expect(page.locator('.profile-panel')).not.toContainText('Anika Rao');
    await expect(page.locator('.profile-panel')).not.toContainText('C-103');
  });

  test('saves and removes a wishlist entry, scopes it to a student and prevents saving their own item', async ({ page }) => {
    await open(page, 'item/calculator');
    await page.getByRole('button', { name: 'Save to wishlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove from wishlist' })).toBeVisible();
    await open(page, 'wishlist');
    await expect(card(page, 'Casio Scientific Calculator')).toBeVisible();
    await page.reload();
    await expect(card(page, 'Casio Scientific Calculator')).toBeVisible();
    await switchTo(page, 'Rohan Mehta');
    await expect(page.getByRole('heading', { name: 'Your wishlist is empty' })).toBeVisible();
    await open(page, 'item/calculator');
    await expect(page.getByRole('button', { name: /Save to wishlist|Remove from wishlist/ })).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await open(page, 'wishlist');
    await card(page, 'Casio Scientific Calculator').getByRole('button', { name: 'Remove from wishlist' }).click();
    await expect(card(page, 'Casio Scientific Calculator')).toHaveCount(0);
    await expect(card(page, 'Navy Interview Blazer')).toBeVisible();
  });
});
