import { test, expect, open, date, dialog, status, error, feedback, switchTo, fillRequest, secondTab, queueWrites, transition } from './support.mjs';

test.describe('Stale or wrong actions', () => {
  test('permits exactly one of two overlapping single-unit acceptances in different tabs', async ({ page, context }) => {
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'request/demo-competing-maya');
    const other = await secondTab(context, 'request/demo-competing-kabir', 'Rohan Mehta');
    await queueWrites(page, [page, other].map(tab => () => tab.getByRole('button', { name: 'Accept request' }).click()));
    await expect(status(page)).toHaveText(/^(Accepted|Declined)$/);
    await expect(status(other)).toHaveText(/^(Accepted|Declined)$/);
    await expect.poll(async () => [await status(page).textContent(), await status(other).textContent()].sort()).toEqual(['Accepted', 'Declined']);
    const mayaDeclined = await status(page).textContent() === 'Declined';
    const refused = mayaDeclined ? page : other;
    await expect(refused.getByRole('main').getByText(`Clashes with ${mayaDeclined ? 'Kabir' : 'Maya'}’s booking`, { exact: true })).toBeVisible();
    await expect(refused.getByRole('button', { name: 'Accept request' })).toHaveCount(0);
  });

  test('revalidates a borrower’s open form when a pickup is accepted in another tab', async ({ page, context }) => {
    await switchTo(page, 'Anika Rao');
    await open(page, 'item/demo-drawing-kit');
    const form = await fillRequest(page, { start: date(6), end: date(7) });
    const send = form.getByRole('button', { name: 'Send request' });
    await expect(send).toBeEnabled();
    const owner = await secondTab(context, 'request/demo-competing-maya', 'Rohan Mehta');
    await transition(owner, 'Accept request', 'Accepted');
    await expect(feedback(page)).toContainText('No units left for those dates');
    await expect(send).toBeDisabled();
    await expect(form.getByLabel('Message', { exact: true })).toHaveValue('Could I pick this up after class?');
  });

  test('rejects a second open request even when it asks for different dates', async ({ page, context }) => {
    await open(page, 'item/calculator');
    const other = await secondTab(context, 'item/calculator', 'Anika Rao');
    await fillRequest(page, { start: date(1), end: date(1) });
    await fillRequest(other, { start: date(6), end: date(6) });
    await queueWrites(page, [page, other].map(tab => () => dialog(tab).getByRole('button', { name: 'Send request' }).click()));
    await expect.poll(async () => (await Promise.all([page, other].map(tab => status(tab).count()))).reduce((total, count) => total + count, 0)).toBe(1);
    const refused = await dialog(page).isVisible() ? page : other;
    await expect(error(refused)).toContainText('You already have an open request');
    await open(refused, 'requests/sent');
    await expect(refused.getByRole('link', { name: /Casio Scientific Calculator/ })).toHaveCount(1);
  });

  test('refuses a rating submitted from a stale tab after the student has already rated', async ({ page, context }) => {
    await open(page, 'request/demo-returned');
    const stale = await secondTab(context, 'request/demo-returned', 'Anika Rao');
    for (const [tab, stars] of [[page, '5 stars'], [stale, '4 stars']]) {
      await tab.getByRole('button', { name: 'Rate this exchange' }).click();
      await dialog(tab).getByRole('radio', { name: stars }).check();
    }
    await dialog(page).getByRole('button', { name: 'Submit rating' }).click();
    await expect(page.getByText('You rated Neha Thomas 5/5.')).toBeVisible();
    await dialog(stale).getByRole('button', { name: 'Submit rating' }).click();
    await expect(error(stale)).toContainText('already been rated');
    await stale.reload();
    await expect(stale.getByText('You rated Neha Thomas 5/5.')).toBeVisible();
    await expect(stale.getByRole('button', { name: 'Rate this exchange' })).toHaveCount(0);
  });
});
