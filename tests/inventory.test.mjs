import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableUnits, changeListingState, createRequest, day, firstAvailableDates, listingVersion, moveRequest, quote, requestTotal, reservationRanges, seed, stockSummary, units, writeListing } from '../dist/data.mjs';
import { itemPage } from '../dist/ui.mjs';

const itemById = (store, id) => store.listings.find(item => item.id === id);
const requestById = (store, id) => store.requests.find(request => request.id === id);
const accept = (store, id) => moveRequest(store, requestById(store, id), 'accepted');
const draft = (overrides = {}) => ({ title: 'Power Strips', description: 'Matching power strips.', mode: 'sell', category: 'electronics', condition: 'Good', quantity: 5, price: 50, deposit: 0, maxDays: 5, ...overrides });
const requestDraft = (item, overrides = {}) => ({ quote: quote(item), body: 'Thanks for sharing!', pickup: 'Maple Hall lobby', start: day(1), end: day(2), quantity: 1, offer: 45, ...overrides });

test('five shared units fit two overlapping bookings and decline only the request that no longer fits', () => {
  const store = seed();
  store.user = 'priya';
  const item = itemById(store, 'extension-boards');
  assert.equal(accept(store, 'demo-boards-aarav'), 0);
  assert.equal(availableUnits(item, store.requests, day(1), day(2)), 3);
  assert.match(itemPage(store, item), /2 reserved for upcoming pickups/);
  assert.equal(accept(store, 'demo-boards-rohan'), 1);
  assert.equal(requestById(store, 'demo-boards-rohan').status, 'accepted');
  assert.equal(requestById(store, 'demo-boards-maya').status, 'declined');
  assert.equal(store.notifications.filter(note => note.user === 'maya' && note.route === 'request/demo-boards-maya').length, 1);
  assert.match(itemPage(store, item), /5 reserved for upcoming pickups/);
  assert.throws(() => accept(store, 'demo-boards-maya'), /No units left for those dates/);

  store.user = 'anika';
  assert.throws(() => createRequest(store, item.id, requestDraft(item)), /No units left for those dates/);
  store.user = 'priya';
  const aarav = requestById(store, 'demo-boards-aarav');
  const rohan = requestById(store, 'demo-boards-rohan');
  assert.deepEqual(requestTotal(aarav), { days: 2, fee: 80, deposit: 200, total: 280 });
  moveRequest(store, aarav, 'handed');
  assert.match(itemPage(store, item), /3 of 5 free now/);
  assert.doesNotMatch(itemPage(store, item), />On loan</);
  moveRequest(store, rohan, 'handed');
  assert.match(itemPage(store, item), />On loan</);
  store.user = 'aarav';
  moveRequest(store, aarav, 'return-reported');
  assert.equal(stockSummary(item, store.requests).out, 5);
  store.user = 'priya';
  moveRequest(store, aarav, 'returned');
  assert.equal(stockSummary(item, store.requests).out, 3);
  assert.equal(availableUnits(item, store.requests, day(1), day(2)), 2);
});

test('availability considers the peak across inclusive dates and an early pickup checks free units today', () => {
  const store = seed();
  store.user = 'priya';
  const item = itemById(store, 'extension-boards');
  const aarav = requestById(store, 'demo-boards-aarav');
  const rohan = requestById(store, 'demo-boards-rohan');
  aarav.quantity = 4;
  aarav.start = aarav.end = day();
  assert.equal(accept(store, aarav.id), 0);
  assert.equal(accept(store, rohan.id), 0);
  assert.equal(stockSummary(item, store.requests).promised, 4);
  assert.equal(availableUnits(item, store.requests, day(), day(2)), 1);
  assert.throws(() => moveRequest(store, rohan, 'handed'), /enough free units/);
  assert.equal(rohan.status, 'accepted');
  assert.deepEqual(firstAvailableDates(day(), 2, [aarav, rohan], 2, 5), { start: day(1), end: day(2) });
});

test('sales and giveaways reserve units and only show completion after the last handover', () => {
  for (const mode of ['sell', 'give']) {
    const store = seed();
    store.user = 'priya';
    const item = itemById(store, writeListing(store, draft({ mode })).id);
    store.user = 'aarav';
    const a = createRequest(store, item.id, requestDraft(item, { quantity: 2 }));
    store.user = 'rohan';
    const b = createRequest(store, item.id, requestDraft(item, { quantity: 3 }));
    store.user = 'maya';
    const c = createRequest(store, item.id, requestDraft(item));
    store.user = 'priya';
    accept(store, a);
    assert.equal(stockSummary(item, store.requests).free, 3);
    assert.equal(accept(store, b), 1);
    assert.equal(requestById(store, c).status, 'declined');
    const exchange = requestById(store, a);
    assert.equal(requestTotal(exchange).fee, mode === 'sell' ? 90 : 0);
    moveRequest(store, exchange, 'handed');
    assert.equal(units(item), 3);
    assert.equal(item.active, true);
    assert.doesNotMatch(itemPage(store, item), />Sold<|>Given away</);
    assert.throws(() => moveRequest(store, exchange, 'handed'), /already changed/);
    moveRequest(store, requestById(store, b), 'handed');
    assert.equal(units(item), 0);
    assert.equal(item.active, false);
    assert.match(itemPage(store, item), mode === 'sell' ? />Sold</ : />Given away</);
  }
});

test('overdue units stay unavailable for future bookings until the owner confirms their return', () => {
  const store = seed();
  const item = itemById(store, 'extension-boards');
  const loan = requestById(store, 'demo-boards-aarav');
  Object.assign(loan, { status: 'return-reported', start: day(-2), end: day(-1) });
  assert.equal(availableUnits(item, store.requests, day(10), day(12)), 3);
  assert.equal(firstAvailableDates(day(10), 1, reservationRanges(store.requests, item.id), 4, 5), null);
  store.user = 'priya';
  moveRequest(store, loan, 'returned');
  assert.equal(availableUnits(item, store.requests, day(10), day(12)), 5);
});

test('duplicates prompt only the same owner, and adding units preserves the existing terms', () => {
  const store = seed();
  store.user = 'priya';
  const item = itemById(store, 'extension-boards');
  const stock = draft({ title: '  EXTENSION‑BOARDS ', quantity: 2 });
  assert.deepEqual(writeListing(store, stock).matches.map(item => item.id), [item.id]);
  assert.equal(units(item), 5);
  assert.equal(writeListing(store, stock, { duplicate: item.id }).merged, true);
  assert.equal(units(item), 7);
  assert.equal(item.mode, 'rent');
  assert.equal(item.price, 20);
  assert.notEqual(writeListing(store, stock, { duplicate: 'separate' }).id, item.id);
  store.user = 'anika';
  assert.throws(() => writeListing(store, stock, { duplicate: item.id }), /matching listing changed/);
  assert.equal(itemById(store, writeListing(store, stock).id).owner, 'anika');
});

test('stock edits and deletion preserve open promises and reject stale or unauthorized changes', () => {
  const store = seed();
  store.user = 'priya';
  const item = itemById(store, 'extension-boards');
  const update = { ...item, quantity: 3 };
  const edit = { key: item.id, version: listingVersion(item) };
  accept(store, 'demo-boards-aarav');
  accept(store, 'demo-boards-rohan');
  assert.throws(() => writeListing(store, update, edit), /at least 5 units/);
  assert.throws(() => writeListing(store, { ...item, mode: 'sell' }, edit), /before changing the share type/);
  moveRequest(store, requestById(store, 'demo-boards-aarav'), 'handed');
  assert.throws(() => changeListingState(store, item.id, edit.version, 'delete'), /before deleting/);
  changeListingState(store, item.id, edit.version, 'pause');
  assert.throws(() => writeListing(store, { ...item, quantity: 6 }, edit), /listing changed/);
  assert.throws(() => changeListingState(store, item.id, edit.version, 'pause'), /listing changed/);
  store.user = 'anika';
  assert.throws(() => changeListingState(store, item.id, listingVersion(item), 'pause'), /unavailable/);
  assert.throws(() => changeListingState(store, item.id, listingVersion(item), 'delete'), /unavailable/);
  assert.throws(() => moveRequest(store, requestById(store, 'demo-boards-aarav'), 'returned'), /already changed/);
  const own = itemById(store, writeListing(store, draft()).id);
  changeListingState(store, own.id, listingVersion(own), 'delete');
  assert.equal(own.deleted, true);
  assert.match(itemPage(store, own), /listing is unavailable/);
});

test('blank text, impossible amounts, invalid dates, stale terms and duplicate requests fail before state changes', () => {
  const store = seed();
  const item = itemById(store, 'extension-boards');
  for (const bad of [draft({ title: '   ' }), draft({ quantity: 0 }), draft({ quantity: 2.5 }), draft({ price: Infinity }), draft({ price: 5.001 }), draft({ price: -1 })]) {
    assert.throws(() => writeListing(store, bad));
  }
  const initial = store.requests.length;
  for (const bad of [{ start: day(-1) }, { start: day(3), end: day(2) }, { start: '2029-02-30' }, { quantity: -2 }, { quantity: 1.5 }, { body: '  ' }, { quote: 'old price' }]) {
    assert.throws(() => createRequest(store, item.id, requestDraft(item, bad)));
  }
  const sale = itemById(store, 'coat');
  for (const offer of [0, -1, 1.001, Infinity, 100001]) assert.throws(() => createRequest(store, sale.id, requestDraft(sale, { offer })), /offer per unit/);
  assert.equal(store.requests.length, initial);
  const first = createRequest(store, item.id, requestDraft(item));
  assert.throws(() => createRequest(store, item.id, requestDraft(item, { start: day(7), end: day(7) })), /already have an open request/);
  moveRequest(store, requestById(store, first), 'cancelled');
  assert.ok(createRequest(store, item.id, requestDraft(item)));
});
