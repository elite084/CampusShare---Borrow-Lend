import { test, expect, open, dialog, date, heading, status, switchTo, fillRequest, sendRequest, publishListing, transition, closeDialog } from './support.mjs';

test.describe('Selling and giving away', () => {
  test('uses per-unit offers, keeps partial stock available, and marks the last handover Sold', async ({ page }) => {
    const listing = await publishListing(page, { title: 'Spare Mugs', mode: 'Sell', quantity: 3, price: 75 });
    await switchTo(page, 'Maya Iyer');
    await open(page, listing);
    const form = await fillRequest(page, { button: 'Make an offer', quantity: 2, offer: 60 });
    await expect(form.getByLabel('Pickup date')).toHaveCount(0);
    await expect(page.locator('#live-total .total')).toContainText('₹120');
    const offer = form.getByLabel('Offer per unit (₹)');
    for (const invalid of ['0', '-1']) {
      await offer.fill(invalid);
      expect(await offer.evaluate(input => input.validity.rangeUnderflow)).toBe(true);
      await form.getByRole('button', { name: 'Send offer' }).click();
      await expect(form).toBeVisible();
    }
    await offer.fill('100001');
    expect(await offer.evaluate(input => input.validity.rangeOverflow)).toBe(true);
    await form.getByRole('button', { name: 'Send offer' }).click();
    await expect(form).toBeVisible();
    await offer.fill('60');
    await form.getByRole('button', { name: 'Send offer' }).click();
    await expect(status(page)).toHaveText('Requested');
    await switchTo(page, 'Anika Rao');
    await transition(page, 'Accept request', 'Accepted');
    await transition(page, 'Mark handed over', 'Handed over');
    await expect(page.getByRole('button', { name: 'Confirm return' })).toHaveCount(0);
    await open(page, listing);
    await expect(page.locator('.item-summary .badge')).toHaveText('For sale');
    await expect(page.locator('.inventory-summary')).toContainText('1 of 1 free now');

    await switchTo(page, 'Rohan Mehta');
    await open(page, listing);
    await sendRequest(page, { button: 'Make an offer', offer: 70 });
    await switchTo(page, 'Anika Rao');
    await transition(page, 'Accept request', 'Accepted');
    await transition(page, 'Mark handed over', 'Handed over');
    await switchTo(page, 'Kabir Shah');
    await open(page, listing);
    await expect(page.locator('.item-summary .badge')).toHaveText('Sold');
    await expect(page.locator('.inventory-summary')).toContainText('0 units left');
    await expect(page.getByRole('button', { name: 'Make an offer' })).toHaveCount(0);
  });

  test('hands over a free giveaway without dates, offers, or a return and blocks another pickup', async ({ page }) => {
    await open(page, 'item/notes');
    const form = await fillRequest(page, { button: 'Request this item' });
    await expect(form.getByLabel('Pickup date')).toHaveCount(0);
    await expect(form.getByLabel('Offer per unit (₹)')).toHaveCount(0);
    await expect(page.locator('#live-total .total')).toContainText('₹0');
    await form.getByRole('button', { name: 'Send request' }).click();
    await expect(status(page)).toHaveText('Requested');
    await switchTo(page, 'Maya Iyer');
    await transition(page, 'Accept request', 'Accepted');
    await transition(page, 'Mark handed over', 'Handed over');
    await expect(page.getByRole('button', { name: /returned it|Confirm return/ })).toHaveCount(0);
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'item/notes');
    await expect(page.locator('.item-summary .badge')).toHaveText('Given away');
    await expect(page.getByRole('button', { name: 'Request this item' })).toHaveCount(0);
  });
});

test.describe('Full borrowing journey', () => {
  test('requests, messages, accepts, hands over, returns and rates from both accounts', async ({ page }) => {
    await open(page, 'item/calculator');
    const route = await sendRequest(page, { start: date(1), end: date(2), message: 'Can I pick up the calculator after lab?' });
    await expect(page.getByText('B-117', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Accept request' })).toHaveCount(0);
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'notifications');
    await page.getByRole('button', { name: /Anika requested Casio Scientific Calculator/ }).click();
    await expect(heading(page)).toHaveText('Casio Scientific Calculator');
    await expect(page.getByText('A-204', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Can I pick up the calculator after lab?', { exact: true })).toBeVisible();
    await transition(page, 'Accept request', 'Accepted');
    await expect(page.getByText('A-204', { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Meet at the Maple Hall lobby at 5.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Meet at the Maple Hall lobby at 5.', { exact: true })).toBeVisible();
    await transition(page, 'Mark handed over', 'Handed over');
    await expect(page.getByRole('button', { name: 'Confirm return' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Rate this exchange' })).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await expect(page.getByText('B-117', { exact: true })).toBeVisible();
    await expect(page.getByText('Meet at the Maple Hall lobby at 5.', { exact: true })).toBeVisible();
    await transition(page, 'I’ve returned it', 'Return reported');
    await expect(page.getByRole('button', { name: 'Confirm return' })).toHaveCount(0);
    await switchTo(page, 'Rohan Mehta');
    await transition(page, 'Confirm return', 'Returned');
    for (const [student, other] of [['Rohan Mehta', 'Anika Rao'], ['Anika Rao', 'Rohan Mehta']]) {
      await switchTo(page, student);
      await page.getByRole('button', { name: 'Rate this exchange' }).click();
      await dialog(page).getByRole('radio', { name: '5 stars' }).check();
      await dialog(page).getByRole('button', { name: 'Submit rating' }).click();
      await expect(page.getByText(`You rated ${other} 5/5.`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Rate this exchange' })).toHaveCount(0);
    }
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`#${route}$`));
    await expect(status(page)).toHaveText('Returned');
  });

  test('cancel and decline require the right role and leave the completed conversation closed', async ({ page }) => {
    await open(page, 'item/calculator');
    await sendRequest(page);
    await expect(page.getByRole('button', { name: 'Decline', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Cancel request' }).click();
    await closeDialog(page);
    await expect(status(page)).toHaveText('Requested');
    await page.getByRole('button', { name: 'Cancel request' }).click();
    await dialog(page).getByRole('button', { name: 'Cancel request' }).click();
    await expect(status(page)).toHaveText('Cancelled');
    await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0);
    await open(page, 'request/demo-incoming');
    await page.getByRole('button', { name: 'Decline', exact: true }).click();
    await dialog(page).getByRole('button', { name: 'Decline request' }).click();
    await expect(status(page)).toHaveText('Declined');
    await switchTo(page, 'Rohan Mehta');
    await expect(status(page)).toHaveText('Declined');
    await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0);
  });
});
