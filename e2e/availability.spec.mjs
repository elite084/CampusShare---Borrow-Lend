import { test, expect, open, date, dialog, status, feedback, fillRequest, sendRequest, switchTo, transition, secondTab, queueWrites, closeDialog } from './support.mjs';

test.describe('Quantities and costs', () => {
  test('updates the rental and deposit estimate and rejects zero, fractional and excess units', async ({ page }) => {
    await open(page, 'item/extension-boards');
    const form = await fillRequest(page, { button: 'Request to rent', quantity: 2, start: date(1), end: date(2) });
    const cost = page.locator('#live-total');
    await expect(cost).toContainText('Rental · 2 units × 2 days');
    await expect(cost).toContainText('₹80');
    await expect(cost).toContainText('₹200');
    await expect(cost.locator('.total')).toContainText('₹280');
    const quantity = form.getByLabel('How many?');
    const send = form.getByRole('button', { name: 'Send request' });
    for (const value of ['0', '1.5', '']) {
      await quantity.fill(value);
      await expect(feedback(page)).toContainText('whole number of units');
      await expect(send).toBeDisabled();
    }
    await quantity.fill('6');
    await expect(feedback(page)).toContainText('Only 5 units left');
    await expect(send).toBeDisabled();
    await quantity.fill('3');
    await expect(cost.locator('.total')).toContainText('₹420');
    await expect(send).toBeEnabled();
    await send.click();
    await expect(status(page)).toHaveText('Requested');
    await expect(page.getByRole('main')).toContainText('3 units');
  });
});

test.describe('Dates and clashes', () => {
  test('refuses past dates, a return before pickup, and a loan over the listing limit', async ({ page }) => {
    await open(page, 'item/calculator');
    const form = await fillRequest(page);
    const pickup = form.getByLabel('Pickup date');
    const returned = form.getByLabel('Return date');
    const send = form.getByRole('button', { name: 'Send request' });
    await pickup.fill(date(-1));
    await expect(feedback(page)).toContainText('today or later');
    await expect(send).toBeDisabled();
    await pickup.fill(date(2));
    await returned.fill(date(1));
    await expect(feedback(page)).toContainText('on or after pickup');
    await expect(send).toBeDisabled();
    await returned.fill(date(7));
    await expect(feedback(page)).toContainText('up to 5 days');
    await expect(send).toBeDisabled();
    await returned.fill(date(6));
    await expect(send).toBeEnabled();
    await send.click();
    await expect(status(page)).toHaveText('Requested');
  });

  test('shows a seeded clash to both roles and offers a free range of the same length', async ({ page }) => {
    await page.getByRole('link', { name: 'See a booking clash' }).click();
    await expect(status(page)).toHaveText('Declined');
    await expect(page.getByRole('main')).toContainText(/overlapping dates were booked|no units left for those dates/i);
    await expect(page.getByRole('main')).not.toContainText('Aarav');
    await switchTo(page, 'Rohan Mehta');
    await expect(page.getByText('Clashes with Aarav’s booking', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept request' })).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await page.getByRole('button', { name: 'Choose other dates or units' }).click();
    const form = dialog(page);
    await form.getByLabel('Return date').fill(date(2));
    await expect(page.locator('#booked-dates')).toContainText('0 of 1 free');
    await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await form.getByRole('button', { name: /^Use / }).click();
    await expect(form.getByLabel('Pickup date')).toHaveValue(date(4));
    await expect(form.getByLabel('Return date')).toHaveValue(date(5));
    await expect(form.getByRole('button', { name: 'Send request' })).toBeEnabled();
  });
});

test.describe('Multi-unit requests', () => {
  test('allocates two plus three units across simultaneous acceptances and declines the next borrower', async ({ page, context }) => {
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    const other = await secondTab(context, 'request/demo-boards-rohan', 'Priya Menon');
    await queueWrites(page, [page, other].map(tab => () => tab.getByRole('button', { name: 'Accept request' }).click()));
    await expect(status(page)).toHaveText('Accepted');
    await expect(status(other)).toHaveText('Accepted');
    await open(page, 'item/extension-boards');
    await expect(page.locator('.inventory-summary')).toContainText('5 reserved for upcoming pickups');

    await switchTo(page, 'Maya Iyer');
    await open(page, 'notifications');
    await page.getByRole('button', { name: /Extension Boards · Stock unavailable/ }).click();
    await expect(status(page)).toHaveText('Declined');
    await expect(page.getByText('No units left for those dates', { exact: true })).toBeVisible();
    await switchTo(page, 'Anika Rao');
    await open(page, 'item/extension-boards');
    const form = await fillRequest(page, { button: 'Request to rent', start: date(1), end: date(2) });
    await expect(feedback(page)).toContainText('No units left for those dates');
    await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await form.getByRole('button', { name: /^Use / }).click();
    await expect(form.getByLabel('Pickup date')).toHaveValue(date(3));
    await closeDialog(page);
  });

  test('shows partial and full custody and releases units only after the owner confirms return', async ({ page }) => {
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Accept request', 'Accepted');
    await open(page, 'request/demo-boards-rohan');
    await transition(page, 'Accept request', 'Accepted');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Mark handed over', 'Handed over');
    await open(page, 'item/extension-boards');
    await expect(page.locator('.item-summary .badge')).toHaveText('For rent');
    await expect(page.locator('.inventory-summary')).toContainText('3 of 5 free now');
    await open(page, 'request/demo-boards-rohan');
    await transition(page, 'Mark handed over', 'Handed over');
    await open(page, 'item/extension-boards');
    await expect(page.locator('.item-summary .badge')).toHaveText('On loan');
    await open(page, 'request/demo-boards-aarav');
    await switchTo(page, 'Aarav Nair');
    await transition(page, 'I’ve returned it', 'Return reported');
    await open(page, 'item/extension-boards');
    await expect(page.locator('.inventory-summary')).toContainText('0 of 5 free now');
    await expect(page.locator('.item-summary .badge')).toHaveText('On loan');
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Confirm return', 'Returned');
    await open(page, 'item/extension-boards');
    await expect(page.locator('.inventory-summary')).toContainText('2 of 5 free now');
    await expect(page.locator('.item-summary .badge')).toHaveText('For rent');
  });
});
