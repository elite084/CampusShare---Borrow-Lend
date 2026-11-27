import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDemoStudent, availableUnits, bookingDays, createRequest, day, listingVersion, moveRequest, quote, requestActions, requestStatus, seed, student, writeListing } from '../dist/data.mjs';

const calculator = store => store.listings.find(item => item.id === 'calculator');
const form = (item, start, end = start) => ({
  quote: quote(item), body: 'Could I borrow this?', pickup: 'Maple Hall lobby', quantity: 1, start, end,
});

test('the booking window is inclusive and enforced when saving', () => {
  const store = seed();
  const item = calculator(store);
  assert.throws(() => createRequest(store, item.id, form(item, day(bookingDays + 1))), /within the next 90 days/);
  assert.throws(() => createRequest(store, item.id, form(item, day(bookingDays), day(bookingDays + 1))), /within the next 90 days/);
  assert.ok(createRequest(store, item.id, form(item, day(bookingDays))));
});

test('expired requests have no actions and release pending and accepted commitments', () => {
  for (const status of ['requested', 'accepted']) {
    const store = seed();
    const item = calculator(store);
    const id = createRequest(store, item.id, form(item, day(1)));
    const request = store.requests.find(request => request.id === id);
    Object.assign(request, { start: day(-1), end: day(-1), status });
    assert.equal(requestStatus(request).name, 'Expired');
    assert.equal(requestStatus(request, 'requested').name, 'Requested');
    assert.deepEqual(requestActions(request, 'rohan'), []);
    assert.equal(availableUnits(item, store.requests, day(), day()), 1);
    store.user = 'rohan';
    assert.throws(() => moveRequest(store, request, 'accepted'), /dates have passed/);
    store.user = 'anika';
    assert.ok(createRequest(store, item.id, form(item, day(1))));
  }
});

test('owners cannot shorten an open loan below the requested duration and borrowers cannot accept it', () => {
  const store = seed();
  const item = calculator(store);
  const id = createRequest(store, item.id, form(item, day(1), day(4)));
  const request = store.requests.find(request => request.id === id);
  assert.throws(() => moveRequest(store, request, 'accepted'), /already changed/);
  store.user = 'rohan';
  const edit = { key: item.id, version: listingVersion(item) };
  assert.throws(() => writeListing(store, { ...item, quantity: 1, maxDays: 3 }, edit), /at least 4 days/);
  assert.equal(item.maxDays, 5);
  writeListing(store, { ...item, quantity: 1, maxDays: 4 }, edit);
  assert.equal(item.maxDays, 4);
  assert.equal(moveRequest(store, request, 'accepted'), 0);
});

test('demo admission normalizes emails and checks them against both seeded and newly added students', () => {
  const store = seed();
  const draft = { name: 'Isha Verma', email: '  Isha.Verma@Campus.Example ', hostel: 'maple' };
  assert.throws(() => addDemoStudent(store, { ...draft, name: '   ' }), /student name/);
  assert.throws(() => addDemoStudent(store, { ...draft, email: 'isha@outside.example' }), /@campus.example/);
  assert.throws(() => addDemoStudent(store, { ...draft, email: 'ANIKA.RAO@CAMPUS.EXAMPLE' }), /already in use/);
  const key = addDemoStudent(store, draft);
  assert.equal(student(store, key).email, 'isha.verma@campus.example');
  assert.throws(() => addDemoStudent(store, { ...draft, email: 'isha.verma@campus.example' }), /already in use/);
});
