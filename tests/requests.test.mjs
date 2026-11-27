import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addBookingDemo, bookedRanges, stockConflict, day, firstAvailableDates, moveRequest, requestActions, seed } from '../dist/data.mjs';
import { requestPage } from '../dist/ui.mjs';

const requestById = (store, id) => store.requests.find(request => request.id === id);

test('the seeded clash explains the decline to both roles without revealing Aarav to the borrower', () => {
  const store = seed();
  const clash = requestById(store, 'demo-clash');
  assert.equal(clash.status, 'declined');
  assert.equal(clash.bookingConflict.borrower, 'aarav');
  const notification = store.notifications.find(note => note.route === 'request/demo-clash');
  assert.equal(notification.user, 'anika');
  assert.match(notification.body, /another student booked overlapping dates/);
  assert.match(requestPage(store, clash), /Choose other dates/);
  assert.doesNotMatch(requestPage(store, clash), /Aarav/);

  store.user = 'rohan';
  const ownerView = requestPage(store, clash);
  assert.match(ownerView, /Clashes with Aarav’s booking/);
  assert.doesNotMatch(ownerView, /Accept request/);
  assert.throws(() => moveRequest(store, clash, 'accepted'), /Clashes with Aarav’s booking/);
});

test('acceptance declines all overlapping requests and leaves adjacent requests available', () => {
  const store = seed();
  store.user = 'rohan';
  const maya = requestById(store, 'demo-competing-maya');
  const kabir = requestById(store, 'demo-competing-kabir');
  const after = { ...structuredClone(kabir), id: 'after', borrower: 'anika', start: day(8), end: day(9) };
  const before = { ...structuredClone(kabir), id: 'before', borrower: 'zoya', start: day(5), end: day(6) };
  store.requests.push(after, before);

  assert.equal(moveRequest(store, maya, 'accepted'), 2);
  assert.equal(kabir.status, 'declined');
  assert.equal(before.status, 'declined');
  assert.equal(after.status, 'requested');
  assert.equal(store.notifications.filter(note => note.route === 'request/demo-competing-kabir' && note.user === 'kabir').length, 1);
  assert.throws(() => moveRequest(store, kabir, 'accepted'), /Clashes with Maya’s booking/);
  assert.equal(moveRequest(store, after, 'accepted'), 0);
});

test('the first free range preserves the requested length and skips adjacent bookings', () => {
  const bookings = [{ start: '2027-01-29', end: '2027-01-31' }, { start: '2027-02-02', end: '2027-02-03' }];
  assert.deepEqual(firstAvailableDates('2027-01-30', 1, bookings), { start: '2027-02-01', end: '2027-02-01' });
  assert.deepEqual(firstAvailableDates('2027-01-30', 2, bookings), { start: '2027-02-04', end: '2027-02-05' });
});

test('borrowers report a return, owners confirm, and the booking stays reserved between those steps', () => {
  const store = seed();
  const loan = requestById(store, 'demo-booking');
  store.user = 'rohan';
  moveRequest(store, loan, 'handed');
  assert.deepEqual(requestActions(loan, 'rohan'), []);
  assert.throws(() => moveRequest(store, loan, 'returned'), /already changed/);
  store.user = 'aarav';
  assert.deepEqual(requestActions(loan, 'aarav'), [['return-reported', 'I’ve returned it']]);
  moveRequest(store, loan, 'return-reported');
  assert.equal(loan.status, 'return-reported');
  assert.equal(stockConflict(store.listings.find(item => item.id === loan.listing), { ...loan, id: 'new' }, store.requests).borrower, loan.borrower);
  assert.doesNotMatch(requestPage(store, loan), /Rate this exchange/);
  assert.throws(() => moveRequest(store, loan, 'returned'), /already changed/);

  store.user = 'rohan';
  assert.match(requestPage(store, loan), /checked its condition/);
  moveRequest(store, loan, 'returned');
  assert.equal(loan.status, 'returned');
  assert.deepEqual(loan.history.map(event => event.status), ['requested', 'accepted', 'handed', 'return-reported', 'returned']);
  assert.equal(bookedRanges(store.requests, loan.listing).length, 0);
  assert.match(requestPage(store, loan), /Rate this exchange/);
});

test('adding the booking demo to a saved session resolves old clashes once', () => {
  const store = seed();
  store.listings = store.listings.filter(item => item.id !== 'demo-drawing-kit');
  store.requests = store.requests.filter(request => request.listing !== 'demo-drawing-kit');
  store.notifications = store.notifications.filter(note => note.route !== 'request/demo-clash');
  const pending = { ...structuredClone(requestById(store, 'demo-sent')), id: 'old-pending', borrower: 'kabir', status: 'requested' };
  pending.history.pop();
  store.requests.push(pending);
  addBookingDemo(store);
  addBookingDemo(store);
  assert.equal(pending.status, 'declined');
  assert.equal(store.notifications.filter(note => note.route === 'request/old-pending').length, 1);
  assert.equal(store.requests.filter(request => request.id === 'demo-clash').length, 1);
  assert.doesNotMatch(requestPage(store, requestById(store, 'demo-returned')), /Return reported/);
});
