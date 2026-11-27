import { test, expect, open, date, dialog, heading, status, error, feedback, card, switchTo, fillRequest, sendRequest, fillListing, publishListing, transition, closeDialog, secondTab, queueWrites } from './support.mjs';

test.describe('Corner cases · Shared and permanent stock', () => {
  test('two identical calculators take two overlapping loans, while a third student can book different dates', async ({ page }) => {
    await switchTo(page, 'Rohan Mehta');
    const item = await publishListing(page, { title: 'Exam Calculators', category: 'Electronics', quantity: 2 });
    const loans = [];
    for (const borrower of ['Maya Iyer', 'Aarav Nair']) {
      await switchTo(page, borrower);
      await open(page, item);
      loans.push(await sendRequest(page, { start: date(1), end: date(2) }));
    }
    await switchTo(page, 'Rohan Mehta');
    for (const loan of loans) {
      await open(page, loan);
      await transition(page, 'Accept request', 'Accepted');
    }
    await switchTo(page, 'Anika Rao');
    await open(page, item);
    const form = await fillRequest(page, { start: date(1), end: date(2) });
    await expect(feedback(page)).toContainText('No units left for those dates');
    await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await form.getByRole('button', { name: /^Use / }).click();
    await expect(form.getByLabel('Pickup date')).toHaveValue(date(3));
    await expect(form.getByLabel('Return date')).toHaveValue(date(4));
    await form.getByRole('button', { name: 'Send request' }).click();
    await expect(status(page)).toHaveText('Requested');
    await switchTo(page, 'Rohan Mehta');
    await transition(page, 'Accept request', 'Accepted');
  });

  test('five boards decline requests for four and one at different thresholds, and five can still be booked later', async ({ page }) => {
    await open(page, 'item/extension-boards');
    const four = await sendRequest(page, { button: 'Request to rent', quantity: 4, start: date(1), end: date(2) });
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Accept request', 'Accepted');
    await open(page, four);
    await expect(status(page)).toHaveText('Declined');
    await expect(page.getByText('Only 3 units left for those dates', { exact: true })).toBeVisible();
    await open(page, 'request/demo-boards-maya');
    await expect(status(page)).toHaveText('Requested');
    await open(page, 'request/demo-boards-rohan');
    await transition(page, 'Accept request', 'Accepted');

    for (const [borrower, route] of [['Anika Rao', four], ['Maya Iyer', 'request/demo-boards-maya']]) {
      await switchTo(page, borrower);
      await open(page, 'notifications');
      await page.getByRole('button', { name: /Extension Boards · Stock unavailable/ }).click();
      await expect(page).toHaveURL(new RegExp(`#${route}$`));
      await expect(status(page)).toHaveText('Declined');
    }
    await open(page, 'item/extension-boards');
    const form = await fillRequest(page, { button: 'Request to rent', quantity: 6, start: date(4), end: date(4) });
    await expect(feedback(page)).toContainText('Only 5 units left');
    await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await form.getByLabel('How many?').fill('5');
    await form.getByRole('button', { name: 'Send request' }).click();
    await expect(status(page)).toHaveText('Requested');
    await switchTo(page, 'Priya Menon');
    await transition(page, 'Accept request', 'Accepted');
  });

  test('five chairs sell in transfers of two and three and notify the third buyer', async ({ page }) => {
    const item = await publishListing(page, { title: 'Hostel Chairs', category: 'Other', mode: 'Sell', quantity: 5, price: 75 });
    const sales = [];
    for (const [buyer, quantity] of [['Priya Menon', 2], ['Maya Iyer', 3], ['Kabir Shah', 1]]) {
      await switchTo(page, buyer);
      await open(page, item);
      sales.push(await sendRequest(page, { button: 'Make an offer', quantity, offer: 65 }));
    }
    await switchTo(page, 'Anika Rao');
    for (const [index, sale] of sales.slice(0, 2).entries()) {
      await open(page, sale);
      await transition(page, 'Accept request', 'Accepted');
      await transition(page, 'Mark handed over', 'Handed over');
      await open(page, item);
      await expect(page.locator('.item-summary .badge')).toHaveText(index === 0 ? 'For sale' : 'Sold');
    }
    await expect(page.locator('.inventory-summary')).toContainText('0 units left');
    await switchTo(page, 'Kabir Shah');
    await open(page, 'notifications');
    await page.getByRole('button', { name: /Hostel Chairs · Stock unavailable/ }).click();
    await expect(page).toHaveURL(new RegExp(`#${sales[2]}$`));
    await expect(status(page)).toHaveText('Declined');
  });
});

test.describe('Corner cases · Duplicate listings and literal input', () => {
  test('the same owner can add another rice cooker or keep a separate listing', async ({ page }) => {
    const location = await publishListing(page, { title: 'Rice cooker' });
    for (const choice of ['Add to Rice cooker', 'Post separately']) {
      const form = await fillListing(page, { title: 'Rice cooker' });
      await form.getByRole('button', { name: 'Publish listing' }).click();
      await expect(form.getByText('You already listed this item')).toBeVisible();
      await form.getByRole('radio', { name: new RegExp(choice) }).check();
      await form.getByRole('button', { name: 'Continue' }).click();
      await expect(dialog(page)).toBeHidden();
      if (choice === 'Add to Rice cooker') {
        await expect(page).toHaveURL(new RegExp(`#${location}$`));
        await expect(page.locator('.inventory-summary')).toContainText('2 of 2 free now');
      } else {
        await expect(page).not.toHaveURL(new RegExp(`#${location}$`));
        await expect(page.locator('.inventory-summary')).toContainText('1 of 1 free now');
      }
    }
    await open(page, 'listings');
    await expect(card(page, 'Rice cooker')).toHaveCount(2);
  });

  test('the same calculator model from two owners appears twice in search and has independent requests', async ({ page }) => {
    const title = 'Casio Scientific Calculator';
    await publishListing(page, { title, category: 'Electronics' });
    await switchTo(page, 'Maya Iyer');
    const requests = [];
    for (const owner of ['Anika Rao', 'Rohan Mehta']) {
      await open(page, 'browse');
      await page.getByRole('searchbox', { name: 'Search listings' }).fill(title);
      await expect(card(page, title)).toHaveCount(2);
      await card(page, title).filter({ hasText: owner }).getByRole('link', { name: title, exact: true }).click();
      requests.push(await sendRequest(page));
      await expect(page.getByRole('main')).toContainText(`Exchange with ${owner}`);
    }
    expect(requests[0]).not.toBe(requests[1]);
  });

  test('displays markup-like text literally in titles and rejects negative or excessive prices', async ({ page }) => {
    const form = await fillListing(page, { title: 'Spare Clipboards', mode: 'Rent per day', price: -5 });
    const price = form.getByLabel('Price per unit per day (₹)');
    const publish = form.getByRole('button', { name: 'Publish listing' });
    await publish.click();
    expect(await price.evaluate(input => input.validity.rangeUnderflow)).toBe(true);
    await price.fill('100001');
    await publish.click();
    expect(await price.evaluate(input => input.validity.rangeOverflow)).toBe(true);
    await expect(dialog(page)).toBeVisible();
    await closeDialog(page);

    const title = '<b>Calculus</b> & "Notes"';
    const item = await publishListing(page, { title, category: 'Academics' });
    await expect(heading(page)).toHaveText(title);
    await expect(heading(page).locator('b')).toHaveCount(0);
    await switchTo(page, 'Maya Iyer');
    await open(page, 'browse');
    await page.getByRole('searchbox', { name: 'Search listings' }).fill(title);
    await expect(card(page, title)).toHaveCount(1);
    await open(page, item);
    await expect(heading(page)).toHaveText(title);
    await expect(heading(page).locator('b')).toHaveCount(0);
  });
});

test.describe('Corner cases · Booking limits and stale decisions', () => {
  test('one cycle accepts one overlapping request and identifies its borrower to the owner', async ({ page }) => {
    await open(page, 'item/bicycle');
    const anika = await sendRequest(page, { button: 'Request to rent', start: date(1), end: date(2) });
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'item/bicycle');
    const rohan = await sendRequest(page, { button: 'Request to rent', start: date(2), end: date(3) });
    await switchTo(page, 'Maya Iyer');
    await open(page, anika);
    await transition(page, 'Accept request', 'Accepted');
    await open(page, rohan);
    await expect(status(page)).toHaveText('Declined');
    await expect(page.getByText('Clashes with Anika’s booking', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept request' })).toHaveCount(0);
  });

  test('blocks a request beyond the 90-day booking window and accepts its last valid day', async ({ page }) => {
    await open(page, 'item/calculator');
    const form = await fillRequest(page, { start: date(91), end: date(91) });
    const send = form.getByRole('button', { name: 'Send request' });
    await expect(feedback(page)).toContainText('within the next 90 days');
    await expect(send).toBeDisabled();
    await form.getByLabel('Pickup date').fill(date(90));
    await form.getByLabel('Return date').fill(date(90));
    await expect(send).toBeEnabled();
    await send.click();
    await expect(status(page)).toHaveText('Requested');
  });

  test('refuses stale acceptance after the dates pass and lets the borrower make a new request', async ({ page }) => {
    await open(page, 'item/calculator');
    const old = await sendRequest(page, { start: date(1), end: date(2) });
    await switchTo(page, 'Rohan Mehta');
    const accept = page.getByRole('button', { name: 'Accept request' });
    await expect(accept).toBeVisible();
    await page.clock.setFixedTime(new Date('2026-11-30T10:00:00+05:30'));
    await accept.click();
    await expect(page.getByRole('status')).toContainText('dates have passed');
    await expect(status(page)).toHaveText('Expired');
    await expect(accept).toHaveCount(0);
    await switchTo(page, 'Anika Rao');
    await open(page, 'item/calculator');
    const fresh = await sendRequest(page);
    expect(fresh).not.toBe(old);
  });

  test('an accepted but uncollected loan expires without exposing private pickup details', async ({ page }) => {
    await open(page, 'request/demo-sent');
    await expect(page.getByText('C-103', { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('I will meet at the common room.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('I will meet at the common room.', { exact: true })).toBeVisible();
    await page.clock.setFixedTime(new Date('2026-12-02T10:00:00+05:30'));
    await page.reload();
    await expect(status(page)).toHaveText('Expired');
    await expect(page.getByText('C-103', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Choose new dates' })).toBeVisible();
    await switchTo(page, 'Zoya Khan');
    await expect(page.getByRole('button', { name: 'Mark handed over' })).toHaveCount(0);
  });

  test('overdue units are withheld until the owner confirms a return', async ({ page }) => {
    await switchTo(page, 'Priya Menon');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'Accept request', 'Accepted');
    await transition(page, 'Mark handed over', 'Handed over');
    await page.clock.setFixedTime(new Date('2026-11-30T10:00:00+05:30'));
    await switchTo(page, 'Anika Rao');
    await open(page, 'item/extension-boards');
    let form = await fillRequest(page, { button: 'Request to rent', quantity: 4, start: date(4), end: date(4) });
    await expect(feedback(page)).toContainText('Only 3 units left for those dates');
    await expect(page.locator('#booked-dates')).toContainText('until overdue stock returns');
    await expect(form.getByRole('button', { name: 'Send request' })).toBeDisabled();
    await expect(form.getByRole('button', { name: /^Use / })).toHaveCount(0);
    await closeDialog(page);
    await switchTo(page, 'Aarav Nair');
    await open(page, 'request/demo-boards-aarav');
    await transition(page, 'I’ve returned it', 'Return reported');
    await switchTo(page, 'Priya Menon');
    await transition(page, 'Confirm return', 'Returned');
    await switchTo(page, 'Anika Rao');
    await open(page, 'item/extension-boards');
    form = await fillRequest(page, { button: 'Request to rent', quantity: 5, start: date(4), end: date(4) });
    await expect(form.getByRole('button', { name: 'Send request' })).toBeEnabled();
    await form.getByRole('button', { name: 'Send request' }).click();
    await expect(status(page)).toHaveText('Requested');
  });

  test('a decline committed before a queued acceptance stays declined in both tabs', async ({ page, context }) => {
    await open(page, 'request/demo-incoming');
    const stale = await secondTab(context, 'request/demo-incoming', 'Anika Rao');
    await page.getByRole('button', { name: 'Decline', exact: true }).click();
    await queueWrites(page, [async () => {
      await dialog(page).getByRole('button', { name: 'Decline request' }).click();
      await stale.getByRole('button', { name: 'Accept request' }).click();
    }]);
    await expect(status(page)).toHaveText('Declined');
    await expect(status(stale)).toHaveText('Declined');
    await expect(stale.getByRole('status')).toContainText('already changed');
    await expect(stale.getByRole('button', { name: 'Mark handed over' })).toHaveCount(0);
  });

  test('double-clicking Accept produces one transition, one notification and a success message', async ({ page }) => {
    await open(page, 'request/demo-incoming');
    await queueWrites(page, [() => page.getByRole('button', { name: 'Accept request' }).dblclick()]);
    await expect(status(page)).toHaveText('Accepted');
    await expect(page.locator('.timeline li.reached').getByText('Accepted', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveText('Request updated · Accepted');
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'notifications');
    await expect(page.getByRole('button', { name: /Compact Electric Kettle · Accepted/ })).toHaveCount(1);
  });

  test('an edit cannot shorten a promised loan, and the current borrower cannot administer the listing', async ({ page }) => {
    await open(page, 'item/calculator');
    const request = await sendRequest(page, { start: date(1), end: date(4) });
    await expect(page.getByRole('button', { name: /Accept request|Mark handed over/ })).toHaveCount(0);
    await open(page, 'item/calculator');
    await expect(page.getByRole('button', { name: /Edit listing|Pause/ })).toHaveCount(0);
    await switchTo(page, 'Rohan Mehta');
    await open(page, 'item/calculator');
    await page.getByRole('button', { name: 'Edit listing' }).click();
    await dialog(page).getByLabel('Maximum loan days').fill('2');
    await dialog(page).getByRole('button', { name: 'Save changes' }).click();
    await expect(error(page)).toContainText('at least 4 days');
    await closeDialog(page);
    await open(page, request);
    await transition(page, 'Accept request', 'Accepted');
  });
});

test.describe('Corner cases · Demo email and ratings', () => {
  test('validates campus emails, rejects duplicates, and persists a new demo student', async ({ page }) => {
    await page.getByRole('button', { name: /Current student Anika Rao/ }).click();
    await expect(dialog(page).getByRole('button', { name: 'Add demo student' })).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Add demo student' }).click();
    const form = dialog(page);
    const name = form.getByLabel('Student name');
    const email = form.getByLabel('Campus email');
    const add = form.getByRole('button', { name: 'Create demo student' });
    await name.fill('   ');
    await email.fill('isha.verma@campus.example');
    await form.getByLabel('Hostel').selectOption({ label: 'Maple Hall' });
    await add.click();
    await expect(error(page)).toContainText('student name');
    await name.fill('Isha Verma');
    await email.fill('not-an-email');
    await add.click();
    expect(await email.evaluate(input => input.validity.typeMismatch)).toBe(true);
    await expect(form).toBeVisible();
    await email.fill('isha.verma@example.net');
    await add.click();
    await expect(error(page)).toContainText('@campus.example');
    await email.fill('ANIKA.RAO@CAMPUS.EXAMPLE');
    await add.click();
    await expect(error(page)).toContainText('already in use');
    await email.fill('isha.verma@campus.example');
    await add.click();
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole('button', { name: /Current student Isha Verma/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: /Current student Isha Verma/ })).toBeVisible();
    await open(page, 'hostels/maple/members');
    await expect(page.getByText('Isha Verma (you)', { exact: true })).toBeVisible();
    await open(page, 'item/calculator');
    await sendRequest(page);
    await switchTo(page, 'Rohan Mehta');
    await expect(page.getByRole('main')).toContainText('Request from Isha Verma');
    await transition(page, 'Accept request', 'Accepted');
  });

  test('clicking the fourth star saves exactly four stars', async ({ page }) => {
    await open(page, 'request/demo-returned');
    await page.getByRole('button', { name: 'Rate this exchange' }).click();
    const fourth = dialog(page).getByRole('radio').nth(3);
    await expect(fourth).toHaveAccessibleName('4 stars');
    await fourth.click();
    await expect(fourth).toBeChecked();
    await expect(dialog(page).getByRole('radio', { name: '5 stars' })).not.toBeChecked();
    await dialog(page).getByRole('button', { name: 'Submit rating' }).click();
    await expect(page.getByText('You rated Neha Thomas 4/5.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('You rated Neha Thomas 4/5.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rate this exchange' })).toHaveCount(0);
  });
});

test('Corner cases · Unknown hostel keys recover like other missing pages', async ({ page }) => {
  await open(page, 'hostels/constructor');
  await expect(page.getByRole('heading', { name: 'This hostel is unavailable' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Browse listings' }).click();
  await expect(heading(page)).toHaveText(/Borrow more/);
});

test.describe('Corner cases · Phone feedback and dark mode', () => {
  test.use({ viewport: { width: 320, height: 844 }, isMobile: true, hasTouch: true });

  test('feedback stays clear of a bottom action and dark text remains readable', async ({ page }, testInfo) => {
    await open(page, 'profile');
    await page.getByRole('main').getByRole('button', { name: 'Dark theme', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await open(page, 'request/demo-incoming');
    await switchTo(page, 'Rohan Mehta');
    const send = page.getByRole('button', { name: 'Send message' });
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('I can pick up before class.');
    await send.evaluate(button => {
      const bounds = button.getBoundingClientRect();
      window.scrollBy(0, bounds.top + bounds.height / 2 - (window.innerHeight - 105));
    });
    await expect(send).toBeInViewport({ ratio: 1 });
    const popup = page.getByRole('status');
    await expect(popup).toContainText('Switched to Rohan Mehta');
    const [button, toast] = await Promise.all([send.boundingBox(), popup.boundingBox()]);
    const overlaps = button.x < toast.x + toast.width && toast.x < button.x + button.width &&
      button.y < toast.y + toast.height && toast.y < button.y + button.height;
    expect(overlaps, 'Visible feedback must leave the Send button readable and tappable').toBe(false);

    const contrast = await send.evaluate(button => {
      const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(channel => Number(channel) / 255);
        const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const style = getComputedStyle(button);
      const colors = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
      return (colors[0] + 0.05) / (colors[1] + 0.05);
    });
    expect(contrast, 'Dark primary action uses the 4.5:1 text contrast target').toBeGreaterThanOrEqual(4.5);
    await testInfo.attach('Dark Send button contrast', { body: `${contrast.toFixed(2)}:1`, contentType: 'text/plain' });
    const viewport = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    expect(viewport).toEqual({ width: 320, content: 320 });
    await send.tap();
    await expect(page.getByText('I can pick up before class.', { exact: true })).toBeVisible();
  });
});
