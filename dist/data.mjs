export const hostels = {
  maple: { name: 'Maple Hall', color: 'purple', pickup: 'Maple Hall lobby', description: 'A little help from the people just down the hall.' },
  cedar: { name: 'Cedar House', color: 'green', pickup: 'Cedar House common room', description: 'Meet the students sharing across Cedar House.' },
  birch: { name: 'Birch Residency', color: 'orange', pickup: 'Birch Residency entrance', description: 'Find everyday essentials shared by Birch residents.' },
};

const people = {
  anika: { name: 'Anika Rao', hostel: 'maple', room: 'A-204', tone: 'violet', stars: 4.9, reviews: 13 },
  rohan: { name: 'Rohan Mehta', hostel: 'maple', room: 'B-117', tone: 'mint', stars: 4.9, reviews: 18 },
  aarav: { name: 'Aarav Nair', hostel: 'maple', room: 'B-209', tone: 'blue', stars: 4.8, reviews: 8 },
  priya: { name: 'Priya Menon', hostel: 'maple', room: 'A-216', tone: 'rose', stars: 4.9, reviews: 10 },
  maya: { name: 'Maya Iyer', hostel: 'maple', room: 'A-312', tone: 'peach', stars: 5.0, reviews: 11 },
  kabir: { name: 'Kabir Shah', hostel: 'maple', room: 'B-226', tone: 'blue', stars: 4.8, reviews: 9 },
  zoya: { name: 'Zoya Khan', hostel: 'cedar', room: 'C-103', tone: 'rose', stars: 4.9, reviews: 15 },
  ishan: { name: 'Ishan Kulkarni', hostel: 'cedar', room: 'C-218', tone: 'blue', stars: 4.7, reviews: 7 },
  neha: { name: 'Neha Thomas', hostel: 'birch', room: 'D-114', tone: 'peach', stars: 5.0, reviews: 6 },
};

export const demoEmailDomain = 'campus.example';
export const students = store => ({ ...people, ...store.students });
export const student = (store, key) => Object.hasOwn(people, key) ? people[key] : Object.hasOwn(store.students ?? {}, key) ? store.students[key] : undefined;

export const categories = {
  electronics: { name: 'Electronics', icon: 'calculator', color: 'purple' },
  transport: { name: 'Transport', icon: 'bike', color: 'green' },
  academics: { name: 'Academics', icon: 'book', color: 'blue' },
  clothing: { name: 'Clothing', icon: 'shirt', color: 'rose' },
  kitchen: { name: 'Kitchen', icon: 'cup', color: 'orange' },
  other: { name: 'Other', icon: 'box', color: 'purple' },
};

export const modes = {
  lend: { label: 'Free to borrow', form: 'Lend for free', action: 'Request to borrow', color: 'green', timed: true },
  rent: { label: 'For rent', form: 'Rent per day', action: 'Request to rent', color: 'purple', timed: true },
  sell: { label: 'For sale', form: 'Sell', action: 'Make an offer', color: 'orange', timed: false },
  give: { label: 'Giveaway', form: 'Give away', action: 'Request this item', color: 'blue', timed: false },
};

export const statuses = {
  requested: { name: 'Requested', color: 'orange' },
  accepted: { name: 'Accepted', color: 'purple' },
  handed: { name: 'Handed over', color: 'blue' },
  'return-reported': { name: 'Return reported', color: 'purple' },
  returned: { name: 'Returned', color: 'green' },
  declined: { name: 'Declined', color: 'rose' },
  cancelled: { name: 'Cancelled', color: 'neutral' },
  expired: { name: 'Expired', color: 'neutral' },
};

export const meetingSpots = ['Campus library entrance', 'Student centre', 'Main canteen', ...Object.values(hostels).map(h => h.pickup)];
export const conditions = ['Like new', 'Good', 'Fair'];
export const currency = amount => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const initials = name => name.split(' ').slice(0, 2).map(word => word[0]).join('');
export const firstName = (store, key) => student(store, key).name.split(' ')[0];
export const stamp = () => new Date().toISOString();

export function day(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const part = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`;
}

const dayNumber = value => Date.parse(value) / 86400000;
const dateString = number => new Date(number * 86400000).toISOString().split('T')[0];
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isInteger(dayNumber(value)) && dateString(dayNumber(value)) === value;
export const dayCount = (start, end) => validDate(start) && validDate(end) ? dayNumber(end) - dayNumber(start) + 1 : 0;
export const bookingDays = 90;

export function loanDateError(item, start, end) {
  const days = dayCount(start, end);
  if (days < 1 || start < day()) return 'Choose a pickup date today or later and a return date on or after pickup.';
  if (end > day(bookingDays)) return `Choose dates within the next ${bookingDays} days.`;
  if (days > item.maxDays) return `Choose a loan of up to ${item.maxDays} ${item.maxDays === 1 ? 'day' : 'days'}.`;
  return '';
}

export const units = record => record.quantity ?? (record.transferred ? 0 : 1);
export const unitLabel = quantity => `${quantity} ${quantity === 1 ? 'unit' : 'units'}`;
export const listingVersion = item => item.revision ?? 0;
export const quote = item => JSON.stringify([item.mode, item.price, item.deposit, item.maxDays]);

export const formatDay = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
export const formatDateRange = (start, end) => start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`;
export const formatTime = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

const listing = (id, title, owner, category, mode, photo, config) => ({
  id, title, owner, category, mode, photo, active: true, price: 0, deposit: 0, maxDays: 7, condition: 'Good', ...config,
});

export function seed() {
  const time = stamp();
  const store = {
    user: 'anika', theme: 'light', students: {},
    listings: [
      listing('calculator', 'Casio Scientific Calculator', 'rohan', 'electronics', 'lend', 'calculator', { condition: 'Like new', maxDays: 5, deposit: 200, description: 'Casio fx-991ES Plus with its slide cover. Great for engineering tutorials and exams. Fresh battery and all buttons work.' }),
      listing('bicycle', 'Campus Cruiser Bicycle', 'maya', 'transport', 'rent', 'bicycle', { price: 80, deposit: 500, maxDays: 7, description: 'An easy-riding city cycle for getting across campus. Includes a lock and has an adjustable seat.' }),
      listing('coat', 'White Lab Coat · Size M', 'kabir', 'academics', 'sell', 'coat', { price: 250, condition: 'Like new', description: 'Clean cotton lab coat with two pockets. Size M. Worn for one semester and washed before pickup.' }),
      listing('notes', 'Semester 2 Engineering Notes', 'maya', 'academics', 'give', 'notes', { condition: 'Good', description: 'Handwritten engineering maths and physics notes, with worked examples and summaries from revision week.' }),
      listing('blazer', 'Navy Interview Blazer', 'zoya', 'clothing', 'rent', 'blazer', { price: 120, deposit: 400, condition: 'Like new', maxDays: 3, description: 'A navy single-breasted blazer, size 38. Ideal for placement interviews or presentations.' }),
      listing('kettle', 'Stainless Steel Electric Kettle', 'ishan', 'kitchen', 'sell', 'kettle', { price: 550, description: 'A 1.5 L electric kettle with an automatic switch-off. Works well for tea and late-night instant noodles.' }),
      listing('notebook', 'Linear Algebra Revision Notes', 'neha', 'academics', 'lend', 'notes', { maxDays: 4, description: 'Two notebooks full of worked problems, revision tables, and a formula sheet.' }),
      listing('anika-kettle', 'Compact Electric Kettle', 'anika', 'kitchen', 'lend', 'kettle', { maxDays: 3, description: 'Small stainless-steel kettle. Happy to lend it for a few nights.' }),
    ],
    requests: [
      { id: 'demo-incoming', listing: 'anika-kettle', borrower: 'rohan', owner: 'anika', mode: 'lend', price: 0, deposit: 0, start: day(1), end: day(2), pickup: hostels.maple.pickup, status: 'requested', history: [{ status: 'requested', at: time }], messages: [{ user: 'rohan', body: 'Hi Anika! Could I borrow this while my kettle is being repaired?', at: time }], ratings: {} },
      { id: 'demo-sent', listing: 'blazer', borrower: 'anika', owner: 'zoya', mode: 'rent', price: 120, deposit: 400, start: day(3), end: day(3), pickup: hostels.cedar.pickup, status: 'accepted', history: [{ status: 'requested', at: time }, { status: 'accepted', at: time }], messages: [{ user: 'anika', body: 'Hi Zoya! I have a placement interview and would love to borrow this.', at: time }, { user: 'zoya', body: 'Of course! I can meet you after 5 at the common room.', at: time }], ratings: {} },
      { id: 'demo-returned', listing: 'notebook', borrower: 'anika', owner: 'neha', mode: 'lend', price: 0, deposit: 0, start: day(-7), end: day(-6), pickup: hostels.birch.pickup, status: 'returned', history: ['requested','accepted','handed','returned'].map(status => ({ status, at: time })), messages: [{ user: 'anika', body: 'Thanks for helping me revise!', at: time }], ratings: {} },
    ],
    wanted: [
      { id: 'w-tripod', owner: 'rohan', title: 'Phone tripod for a project', category: 'electronics', description: 'Need to film a short lab demo this week. A small tripod or stand would be perfect.', needed: day(4), offers: [], closed: false, at: time },
      { id: 'w-safety', owner: 'zoya', title: 'Safety goggles for chemistry lab', category: 'academics', description: 'Looking to borrow a pair for one practical. I can pick them up near Cedar House.', needed: day(3), offers: [], closed: false, at: time },
      { id: 'w-pan', owner: 'anika', title: 'A frying pan for hostel cook night', category: 'kitchen', description: 'We’re planning a small cook night in Maple Hall and need an extra induction-compatible pan.', needed: day(6), offers: [{ id: 'offer-maya', user: 'maya', body: 'I have a small induction pan you can borrow. Meet me in the Maple lobby?', pickup: hostels.maple.pickup, status: 'offered', at: time }], closed: false, at: time },
    ],
    saved: { anika: ['blazer'] },
    notifications: [
      { id: 'n-incoming', user: 'anika', title: 'Rohan requested your kettle', body: 'Review the request and set up a pickup.', route: 'request/demo-incoming', read: false, at: time },
      { id: 'n-accepted', user: 'anika', title: 'Zoya accepted your request', body: 'Pickup for the navy blazer is confirmed.', route: 'request/demo-sent', read: false, at: time },
      { id: 'n-wanted', user: 'anika', title: 'Maya offered to help', body: 'You have an offer on your frying pan post.', route: 'wanted/w-pan', read: false, at: time },
    ],
  };
  addBookingDemo(store);
  addInventoryDemo(store);
  return store;
}

export function addInventoryDemo(store) {
  if (store.listings.some(item => item.id === 'extension-boards')) return;
  const item = listing('extension-boards', 'Extension Boards', 'priya', 'electronics', 'rent', '', {
    condition: 'Good', quantity: 5, price: 20, deposit: 100, maxDays: 5,
    description: 'Five matching four-socket extension boards for hostel projects and events. Ask for as many as you need.',
  });
  store.listings.push(item);
  const at = stamp();
  const requests = [['aarav', 2], ['rohan', 3], ['maya', 1]];
  for (const [borrower, quantity] of requests) {
    store.requests.push({ id: `demo-boards-${borrower}`, listing: item.id, borrower, owner: item.owner, mode: item.mode,
      quantity, price: item.price, deposit: item.deposit, start: day(1), end: day(2), pickup: hostels.maple.pickup,
      status: 'requested', history: [{ status: 'requested', at }], ratings: {},
      messages: [{ user: borrower, body: `Could I rent ${unitLabel(quantity)} for our hostel event?`, at }],
    });
  }
}

export function addBookingDemo(store) {
  if (store.listings.some(item => item.id === 'demo-drawing-kit')) return;
  const item = listing('demo-drawing-kit', 'Engineering Drawing Kit', 'rohan', 'academics', 'lend', '', {
    deposit: 100, maxDays: 5,
    description: 'A drawing board, T-square, compass, and set squares for engineering graphics practicals.',
  });
  store.listings.push(item);

  const at = stamp();
  const request = (key, borrower, start, end, status, body) => ({
    id: key, listing: item.id, borrower, owner: item.owner, mode: item.mode, price: item.price, deposit: item.deposit,
    start: day(start), end: day(end), pickup: hostels.maple.pickup, status,
    history: (status === 'accepted' ? ['requested', 'accepted'] : ['requested']).map(status => ({ status, at })),
    messages: [{ user: borrower, body, at }], ratings: {},
  });
  store.requests.push(
    request('demo-booking', 'aarav', 1, 3, 'accepted', 'Could I borrow the kit for my graphics practical?'),
    request('demo-clash', 'anika', 2, 3, 'requested', 'I’m working on a drawing assignment and could use the kit.'),
    request('demo-competing-maya', 'maya', 6, 7, 'requested', 'Can I use this for our weekend studio session?'),
    request('demo-competing-kabir', 'kabir', 7, 8, 'requested', 'I’d like to borrow this for my assignment.'),
  );
  declineClashingRequests(store);
}

export function requestTotal(request) {
  const days = modes[request.mode].timed ? Math.max(0, dayCount(request.start, request.end)) : 0;
  const quantity = units(request);
  const unitFee = request.mode === 'rent' ? Math.round(request.price * 100) * days : request.mode === 'sell' ? Math.round(Number(request.offer) * 100) : 0;
  const fee = unitFee * quantity / 100;
  const deposit = modes[request.mode].timed ? Math.round(request.deposit * 100) * quantity / 100 : 0;
  return { days, fee, deposit, total: fee + deposit };
}

export function requestIsExpired(request) {
  return (request.status === 'requested' || request.status === 'accepted') && modes[request.mode].timed && request.end < day();
}

export function requestStatus(request, step) {
  if (!step && requestIsExpired(request)) return statuses.expired;
  const status = step ?? request.status;
  return status === 'returned' && !modes[request.mode].timed ? statuses.handed : statuses[status];
}

export function requestActions(request, user) {
  if ((request.owner !== user && request.borrower !== user) || requestIsExpired(request)) return [];
  if (request.status === 'requested') {
    return request.owner === user ? [['declined', 'Decline'], ['accepted', 'Accept request']] : [['cancelled', 'Cancel request']];
  }
  if (request.status === 'accepted') {
    return request.owner === user ? [['cancelled', 'Cancel request'], ['handed', 'Mark handed over']] : [['cancelled', 'Cancel request']];
  }
  if (request.status === 'handed' && request.borrower === user && modes[request.mode].timed) return [['return-reported', 'I’ve returned it']];
  return request.status === 'return-reported' && request.owner === user ? [['returned', 'Confirm return']] : [];
}

const withBorrower = request => ['handed', 'return-reported'].includes(request.status);
export const isOpenRequest = request => !requestIsExpired(request) && (request.status === 'requested' || request.status === 'accepted' || withBorrower(request));

export function bookedRanges(requests, listingId) {
  return requests.filter(request => request.listing === listingId && modes[request.mode].timed && request.start && request.end && !requestIsExpired(request) && (request.status === 'accepted' || withBorrower(request)))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function reservationRanges(requests, listingId, excludeId) {
  const today = day();
  return bookedRanges(requests, listingId).filter(request => request.id !== excludeId).map(request => withBorrower(request) ? {
    ...request, start: request.handedOn && request.handedOn < request.start ? request.handedOn : request.start < today ? request.start : today,
    end: request.end < today ? null : request.end,
  } : request);
}

export function reservationWindows(bookings) {
  const changes = new Map();
  for (const booking of bookings) {
    const start = dayNumber(booking.start);
    const after = booking.end ? dayNumber(booking.end) + 1 : Infinity;
    const count = units(booking);
    changes.set(start, (changes.get(start) ?? 0) + count);
    changes.set(after, (changes.get(after) ?? 0) - count);
  }
  const boundaries = [...changes.keys()].filter(date => changes.get(date) !== 0).sort((a, b) => a - b);
  let quantity = 0;
  const windows = [];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const boundary = boundaries[index];
    quantity += changes.get(boundary);
    const next = boundaries[index + 1];
    if (quantity > 0) windows.push({ start: dateString(boundary), end: Number.isFinite(next) ? dateString(next - 1) : null, quantity });
  }
  return windows;
}

const overlap = (a, b) => (!b.end || a.start <= b.end) && (!a.end || a.end >= b.start);
const sumUnits = records => records.reduce((total, record) => total + units(record), 0);
const peakUnits = windows => windows.reduce((peak, window) => Math.max(peak, units(window)), 0);

export function stockSummary(item, requests, exceptId) {
  const capacity = units(item);
  const related = requests.filter(request => request.listing === item.id && request.id !== exceptId);
  const accepted = related.filter(request => request.status === 'accepted');
  if (!modes[item.mode].timed) {
    const reserved = sumUnits(accepted);
    return { capacity, out: 0, reserved, free: Math.max(0, capacity - reserved), promised: reserved };
  }
  const today = day();
  const out = sumUnits(related.filter(withBorrower));
  const live = reservationWindows(reservationRanges(related, item.id)).filter(window => !window.end || window.end >= today);
  const pickupWindows = reservationWindows(accepted).filter(window => window.end >= today);
  const reservedToday = sumUnits(accepted.filter(request => request.start <= today && request.end >= today));
  return { capacity, out, reserved: peakUnits(pickupWindows), free: Math.max(0, capacity - out - reservedToday), promised: Math.max(out, peakUnits(live)) };
}

export function availableUnits(item, requests, start, end, exceptId) {
  if (!modes[item.mode].timed) return stockSummary(item, requests, exceptId).free;
  const overlapping = reservationWindows(reservationRanges(requests, item.id, exceptId)).filter(window => overlap(window, { start, end }));
  return Math.max(0, units(item) - peakUnits(overlapping));
}

export function stockConflict(item, request, requests) {
  const timed = modes[item.mode].timed;
  const available = availableUnits(item, requests, request.start, request.end, request.id);
  const requested = units(request);
  if (requested <= available) return;
  const booking = timed && requested === 1 && units(item) === 1 && reservationRanges(requests, item.id, request.id).find(other => overlap(other, request));
  return { timed, available, requested, ...(booking ? { borrower: booking.borrower, start: booking.start, end: booking.end } : {}) };
}

export function clashLabel(store, conflict, owner = false) {
  if (owner && conflict.borrower) return `Clashes with ${firstName(store, conflict.borrower)}’s booking`;
  if (conflict.available === undefined) return 'Overlapping dates were booked';
  const when = conflict.timed ? ' for those dates' : ' for pickup';
  return conflict.available === 0 ? `No units left${when}` : `Only ${unitLabel(conflict.available)} left${when}`;
}

export function firstAvailableDates(start, duration, bookings, quantity = 1, capacity = 1) {
  if (quantity > capacity) return null;
  let begin = dayNumber(start);
  let end = begin + duration - 1;
  for (const window of reservationWindows(bookings)) {
    if (units(window) + quantity <= capacity || (window.end && dayNumber(window.end) < begin)) continue;
    if (dayNumber(window.start) > end) break;
    if (!window.end) return null;
    begin = dayNumber(window.end) + 1;
    end = begin + duration - 1;
  }
  return { start: dateString(begin), end: dateString(end) };
}

export function notifyUser(store, user, title, body, route, noteId = id()) {
  store.notifications.unshift({ id: noteId, user, title, body, route, read: false, at: stamp() });
}

function declineClashingRequests(store, listingId) {
  let declined = 0;
  for (const request of store.requests) {
    if (request.status !== 'requested' || requestIsExpired(request) || (listingId && request.listing !== listingId)) continue;
    const item = store.listings.find(item => item.id === request.listing);
    const conflict = item && stockConflict(item, request, store.requests);
    if (!conflict) continue;
    request.status = 'declined';
    request.bookingConflict = conflict;
    request.history.push({ status: 'declined', at: stamp() });
    const reason = conflict.borrower ? 'another student booked overlapping dates' : conflict.available === 0 ? 'no units were available' : `only ${unitLabel(conflict.available)} were available for your request for ${unitLabel(conflict.requested)}`;
    notifyUser(store, request.borrower, `${item.title} · ${conflict.borrower ? 'Dates booked' : 'Stock unavailable'}`, `Your request was declined because ${reason}.`, `request/${request.id}`, `booking-conflict-${request.id}`);
    declined++;
  }
  return declined;
}

export function moveRequest(store, request, status) {
  const item = store.listings.find(listing => listing.id === request.listing);
  if (!item || item.deleted) throw new Error('This listing is unavailable.');
  if (requestIsExpired(request)) throw new Error('These borrowing dates have passed. Ask the student to send a new request.');
  if (status === 'accepted' && store.user === request.owner) {
    const conflict = request.bookingConflict ?? stockConflict(item, request, store.requests);
    if (conflict) throw new Error(`${clashLabel(store, conflict, true)}.`);
  }
  if (!requestActions(request, store.user).some(([next]) => next === status)) throw new Error('This request has already changed.');
  const timed = modes[request.mode].timed;
  if (status === 'accepted' && !item.active) throw new Error('This listing is currently unavailable.');
  if (status === 'handed') {
    const today = day();
    const available = timed ? Math.min(
      units(item) - stockSummary(item, store.requests).out,
      availableUnits(item, store.requests, today, request.end, request.id),
    ) : availableUnits(item, store.requests, '', '', request.id);
    if (available < units(request)) throw new Error('There aren’t enough free units to hand this over now. Check pending pickups and returns.');
    if (timed) request.handedOn = today;
  }
  const transferred = status === 'handed' && !timed;
  request.status = transferred ? 'returned' : status;
  request.history.push({ status, at: stamp() });
  if (transferred) {
    item.quantity = units(item) - units(request);
    item.revision = listingVersion(item) + 1;
    item.transferred = item.quantity === 0;
    if (item.transferred) item.active = false;
  }
  const declined = ['accepted', 'handed'].includes(status) ? declineClashingRequests(store, item.id) : 0;
  const other = store.user === request.owner ? request.borrower : request.owner;
  const message = status === 'return-reported' ? `${firstName(store, store.user)} says they returned ${unitLabel(units(request))}. Check the condition and confirm when you have them back.` : `${firstName(store, store.user)} updated your exchange.`;
  notifyUser(store, other, `${item.title} · ${requestStatus(request).name}`, message, `request/${request.id}`);
  return declined;
}

function validateText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`Enter ${label} with 1 to ${maxLength} characters.`);
  }
  return value.trim();
}

export function addDemoStudent(store, draft) {
  const name = validateText(draft.name, 'a student name', 60);
  const email = validateText(draft.email, 'a campus email', 254).toLowerCase();
  const [local, domain, extra] = email.split('@');
  if (domain !== demoEmailDomain || extra !== undefined || !/^[a-z\d]+(?:[._+-][a-z\d]+)*$/.test(local)) {
    throw new Error(`Use a demo campus email ending in @${demoEmailDomain}.`);
  }
  if (!Object.hasOwn(hostels, draft.hostel)) throw new Error('Choose a hostel.');
  const addresses = Object.values(students(store)).map(person => person.email ?? `${person.name.toLowerCase().replaceAll(' ', '.')}@${demoEmailDomain}`);
  if (addresses.includes(email)) throw new Error('That campus email is already in use.');
  const key = id();
  store.students ??= {};
  store.students[key] = { name, email, hostel: draft.hostel, tone: 'violet', stars: 0, reviews: 0 };
  return key;
}

function checkMoney(value, label, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum || value > 100000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
    throw new Error(`Enter ${label} from ${currency(minimum)} to ${currency(100000)} with up to two decimal places.`);
  }
  return value;
}

function checkQuantity(quantity, minimum = 1) {
  if (!Number.isSafeInteger(quantity) || quantity < minimum) throw new Error('Enter a valid whole number of units.');
}

const normalizedTitle = title => title.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, ' ').trim();

function ownedListing(store, key, version) {
  const item = store.listings.find(item => item.id === key && item.owner === store.user && !item.deleted);
  if (!item) throw new Error('This listing is unavailable.');
  if (listingVersion(item) !== version) throw new Error('This listing changed. Reopen it to use its latest stock and details.');
  return item;
}

export function writeListing(store, draft, { key, version, duplicate } = {}) {
  const existing = key ? ownedListing(store, key, version) : null;
  const title = validateText(draft.title, 'an item name', 70);
  const description = validateText(draft.description, 'a description', 500);
  const { mode, category, condition, quantity } = draft;
  if (!Object.hasOwn(modes, mode) || !Object.hasOwn(categories, category) || !conditions.includes(condition)) throw new Error('Choose a valid share type, category, and condition.');
  checkQuantity(quantity, existing?.mode === mode && units(existing) === 0 ? 0 : 1);
  const timed = modes[mode].timed;
  const price = mode === 'rent' || mode === 'sell' ? checkMoney(draft.price, 'a unit price', .01) : 0;
  const deposit = timed ? checkMoney(draft.deposit, 'a deposit per unit') : 0;
  if (timed && (!Number.isInteger(draft.maxDays) || draft.maxDays < 1 || draft.maxDays > 90)) throw new Error('Enter a maximum loan of 1 to 90 days.');

  if (!existing) {
    const matches = store.listings.filter(item => !item.deleted && item.owner === store.user && normalizedTitle(item.title) === normalizedTitle(title));
    if (matches.length && !duplicate) return { matches };
    if (duplicate && duplicate !== 'separate') {
      const match = matches.find(item => item.id === duplicate);
      if (!match) throw new Error('The matching listing changed. Review the item name and choose where to add these units.');
      const current = units(match);
      checkQuantity(current + quantity);
      match.quantity = current + quantity;
      match.revision = listingVersion(match) + 1;
      if (current === 0) { match.active = true; match.transferred = false; }
      return { id: match.id, merged: true };
    }
  }

  if (existing) {
    const open = store.requests.filter(request => request.listing === key && isOpenRequest(request));
    if (existing.mode !== mode && open.length) throw new Error('Finish or close the open requests before changing the share type.');
    if (timed && draft.maxDays < existing.maxDays) {
      const minimum = open.reduce((longest, request) => Math.max(longest, dayCount(request.start, request.end)), 0);
      if (draft.maxDays < minimum) throw new Error(`Keep a maximum loan of at least ${minimum} days to cover open requests.`);
    }
    const { promised } = stockSummary(existing, store.requests);
    if (quantity < units(existing) && quantity < promised) throw new Error(`Keep at least ${unitLabel(promised)} to cover existing pickups and loans.`);
  }

  const item = { ...existing, id: key || id(), title, description, category, condition, mode, owner: store.user, quantity, price, deposit,
    maxDays: timed ? draft.maxDays : 0, photo: draft.photo || existing?.photo || '', at: existing?.at ?? stamp(),
    active: quantity > 0 && (!existing || units(existing) === 0 || existing.active), transferred: quantity === 0,
    revision: existing ? listingVersion(existing) + 1 : 0 };
  if (existing) {
    Object.assign(existing, item);
    declineClashingRequests(store, key);
  } else store.listings.unshift(item);
  return { id: item.id };
}

export function changeListingState(store, key, version, operation) {
  const item = ownedListing(store, key, version);
  if (operation === 'delete') {
    if (store.requests.some(request => request.listing === key && isOpenRequest(request))) throw new Error('Finish or close all open requests before deleting this listing.');
    item.deleted = true;
    item.active = false;
  } else {
    if (units(item) === 0) throw new Error('Add stock before resuming this listing.');
    if (!['pause', 'resume'].includes(operation) || item.active === (operation === 'resume')) throw new Error('This listing has already changed.');
    item.active = operation === 'resume';
  }
  item.revision = listingVersion(item) + 1;
  return item.active;
}

export const openRequestFor = (store, itemId) => store.requests.find(request => request.listing === itemId && request.borrower === store.user && isOpenRequest(request));

export function createRequest(store, key, draft) {
  const item = store.listings.find(item => item.id === key);
  if (!item?.active || item.deleted || item.owner === store.user || units(item) === 0) throw new Error('This item is unavailable.');
  if (draft.quote !== quote(item)) throw new Error('The listing terms changed. Review the current terms before sending.');
  if (openRequestFor(store, key)) throw new Error('You already have an open request for this listing.');
  if (!meetingSpots.includes(draft.pickup)) throw new Error('Choose a pickup spot.');
  checkQuantity(draft.quantity);
  const body = validateText(draft.body, 'a message', 280);
  const timed = modes[item.mode].timed;
  const { start, end } = draft;
  if (timed) {
    const warning = loanDateError(item, start, end);
    if (warning) throw new Error(warning);
  }
  const request = { id: id(), listing: key, borrower: store.user, owner: item.owner, mode: item.mode, price: item.price, deposit: item.deposit,
    quantity: draft.quantity, pickup: draft.pickup, start: timed ? start : '', end: timed ? end : '',
    offer: item.mode === 'sell' ? checkMoney(draft.offer, 'an offer per unit', .01) : 0,
    status: 'requested', history: [{ status: 'requested', at: stamp() }], messages: [{ user: store.user, body, at: stamp() }], ratings: {} };
  const conflict = stockConflict(item, request, store.requests);
  if (conflict) throw new Error(`${clashLabel(store, conflict)}.`);
  if (!Number.isSafeInteger(Math.round(requestTotal(request).total * 100))) throw new Error('The requested quantity and cost exceed the supported total.');
  store.requests.unshift(request);
  notifyUser(store, item.owner, `${firstName(store, store.user)} requested ${item.title}`, `Open the request for ${unitLabel(request.quantity)} to review the pickup.`, `request/${request.id}`);
  return request.id;
}

export function reputation(store, user) {
  const person = student(store, user);
  const ratings = store.requests.flatMap(request => Object.values(request.ratings)).filter(rating => rating.recipient === user);
  const count = person.reviews + ratings.length;
  const score = count ? ((person.stars * person.reviews + ratings.reduce((sum, rating) => sum + rating.stars, 0)) / count).toFixed(1) : null;
  return { ratings, score, count };
}
