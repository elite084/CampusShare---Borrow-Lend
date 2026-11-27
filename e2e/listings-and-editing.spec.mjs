import { test, expect, open, heading, switchTo, card, dialog, error, photo, fillListing, publishListing, closeDialog, transition, secondTab } from './support.mjs';

test.describe('Listings', () => {
  test('searches, filters by category, type, hostel and price, and clears an empty result', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search listings' });
    await expect(page.locator('.listing-card').first()).toContainText('Maple Hall');
    await search.fill('calCulator');
    await expect(page.locator('.listing-card')).toHaveCount(1);
    await expect(card(page, 'Casio Scientific Calculator')).toBeVisible();
    await search.fill('something-with-no-results');
    await expect(page.getByRole('heading', { name: 'No listings found' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(search).toHaveValue('');
    await page.getByRole('button', { name: 'Clothing', exact: true }).click();
    await expect(page.locator('.listing-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const form = dialog(page);
    await form.getByLabel('Listing type').selectOption({ label: 'Rent per day' });
    await form.getByLabel('Hostel').selectOption({ label: 'Cedar House' });
    await form.getByLabel(/Maximum price/).fill('120');
    await form.getByRole('button', { name: 'Apply filters' }).click();
    await expect(card(page, 'Navy Interview Blazer')).toBeVisible();
    await expect(page.locator('.listing-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Filters (3)', exact: true }).click();
    await form.getByLabel(/Maximum price/).fill('119');
    await form.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.getByRole('heading', { name: 'No listings found' })).toBeVisible();
  });

  test('publishes an uploaded listing and refuses a blank name or invalid paid price', async ({ page }) => {
    const bad = await fillListing(page, { title: '   ' });
    await bad.getByRole('button', { name: 'Publish listing' }).click();
    await expect(error(page)).toHaveText(/Enter an item name/);
    await closeDialog(page);
    const unpaid = await fillListing(page, { title: 'Sale thermos', mode: 'Sell', price: 0 });
    const price = unpaid.getByLabel(/Asking price per unit/);
    expect(await price.evaluate(input => ({
      underMinimum: input.validity.rangeUnderflow,
      hasValidationMessage: input.validationMessage.length > 0,
    }))).toEqual({ underMinimum: true, hasValidationMessage: true });
    await unpaid.getByRole('button', { name: 'Publish listing' }).click();
    await expect(unpaid).toBeVisible();
    await closeDialog(page);
    const route = await publishListing(page, { title: 'Insulated Test Thermos', image: photo });
    await expect(page.getByRole('img', { name: 'Insulated Test Thermos' })).toHaveAttribute('src', /^data:image\/jpeg/);
    await switchTo(page, 'Maya Iyer');
    await open(page, route);
    await expect(page.getByRole('button', { name: 'Request to borrow' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit listing' })).toHaveCount(0);
  });

  test('offers a same-owner merge or separate listing while keeping another owner independent', async ({ page }) => {
    await switchTo(page, 'Priya Menon');
    const sameTitle = { title: 'extension-boards', category: 'Electronics', quantity: 2 };
    let form = await fillListing(page, sameTitle);
    await form.getByRole('button', { name: 'Publish listing' }).click();
    await expect(form.getByText('You already listed this item')).toBeVisible();
    await form.getByRole('radio', { name: /Add to Extension Boards/ }).check();
    await form.getByRole('button', { name: 'Continue' }).click();
    await expect(heading(page)).toHaveText('Extension Boards');
    await expect(page.locator('.item-summary')).toContainText('7 of 7 free now');
    await expect(page.locator('.item-summary .badge')).toHaveText('For rent');

    form = await fillListing(page, sameTitle);
    await form.getByRole('button', { name: 'Publish listing' }).click();
    await form.getByRole('radio', { name: 'Post separately' }).check();
    await form.getByRole('button', { name: 'Continue' }).click();
    await expect(heading(page)).toHaveText('extension-boards');
    await expect(page.locator('.item-summary')).toContainText('2 of 2 free now');
    await switchTo(page, 'Anika Rao');
    await publishListing(page, { ...sameTitle, title: 'Extension Boards', quantity: 1 });
    await expect(page.locator('.owner-panel')).toContainText('Anika Rao');
    await expect(page.locator('.item-summary')).toContainText('1 of 1 free now');
  });
});

test.describe('Editing listings', () => {
  test('saves edits, pauses and resumes availability, and only deletes after confirmation', async ({ page }) => {
    const route = await publishListing(page, { title: 'Spare Thermos' });
    await page.getByRole('button', { name: 'Edit listing' }).click();
    await dialog(page).getByLabel('Item name').fill('Updated Thermos');
    await dialog(page).getByLabel('Total units').fill('2');
    await dialog(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(heading(page)).toHaveText('Updated Thermos');
    await expect(page.locator('.inventory-summary')).toContainText('2 of 2 free now');
    await open(page, 'listings');
    const item = card(page, 'Updated Thermos');
    await item.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(item.getByText('Paused', { exact: true })).toBeVisible();
    await switchTo(page, 'Maya Iyer');
    await open(page, route);
    await expect(page.getByRole('button', { name: 'Request to borrow' })).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await open(page, 'listings');
    await item.getByRole('button', { name: 'Resume', exact: true }).click();
    await expect(item.getByText('Free to borrow', { exact: true })).toBeVisible();
    await item.getByRole('button', { name: 'Delete listing' }).click();
    await dialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(item).toBeVisible();
    await item.getByRole('button', { name: 'Delete listing' }).click();
    await dialog(page).getByRole('button', { name: 'Delete listing' }).click();
    await expect(item).toHaveCount(0);
    await open(page, route);
    await expect(page.getByRole('heading', { name: 'This listing is unavailable' })).toBeVisible();
  });

  test('protects the share type and committed stock and refuses to delete a loaned item', async ({ page }) => {
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Accept request', 'Accepted');
    await transition(page, 'Mark handed over', 'Handed over');
    await open(page, 'item/extension-boards');
    await page.getByRole('button', { name: 'Edit listing' }).click();
    await expect(dialog(page).getByLabel('Share type')).toBeDisabled();
    await dialog(page).getByLabel('Total units').fill('1');
    await dialog(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(error(page)).toContainText('Keep at least 2 units');
    await closeDialog(page);
    await open(page, 'listings');
    await card(page, 'Extension Boards').getByRole('button', { name: 'Delete listing' }).click();
    await expect(page.getByRole('status')).toContainText('before deleting this listing');
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Extension Boards')).toContainText('3 of 5 free now');
  });

  test('rejects a stale edit from another tab and keeps the latest stock', async ({ page, context }) => {
    await switchTo(page, 'Priya Menon');
    await open(page, 'item/extension-boards');
    const stale = await secondTab(context, 'item/extension-boards', 'Priya Menon');
    for (const tab of [page, stale]) await tab.getByRole('button', { name: 'Edit listing' }).click();
    await dialog(page).getByLabel('Total units').fill('6');
    await dialog(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('.inventory-summary')).toContainText('6 of 6 free now');
    await dialog(stale).getByLabel('Total units').fill('7');
    await dialog(stale).getByRole('button', { name: 'Save changes' }).click();
    await expect(error(stale)).toContainText('This listing changed');
    await closeDialog(stale);
    await expect(stale.locator('.inventory-summary')).toContainText('6 of 6 free now');
  });
});
