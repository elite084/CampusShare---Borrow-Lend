import { hostels, student, students, demoEmailDomain, addDemoStudent, bookingDays, loanDateError, requestIsExpired, categories, modes, meetingSpots, conditions, seed, id, firstName, stamp, day, dayCount, moveRequest, stockConflict, clashLabel, reservationRanges, reservationWindows, firstAvailableDates, formatDay, formatDateRange, isOpenRequest, notifyUser, requestStatus, units, unitLabel, quote, listingVersion, writeListing, changeListingState, createRequest, openRequestFor, validDate } from './data.mjs';
import { icon, escape, avatar, action, optionList, field, hostelName, priceLabel, photo, layout, browse, browseResults, itemPage, myListings, wishlist, requestsPage, requestPage, costSummary, inventoryDetails, wantedBoard, wantedPage, hostelsPage, notificationsPage, profilePage, missing } from './ui.mjs';
import { accessDemo } from './store.mjs';

const root = document.querySelector('#app');
const dialog = document.querySelector('#modal');
const toast = document.querySelector('#toast');
const accountKey = 'campusshare-account';
const updateChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('campusshare-demo-updates') : null;
const updateKey = 'campusshare-demo-update';
const defaultFilters = () => ({ category: '', mode: '', hostel: '', price: '', sort: 'hostel' });
let store = seed();
let route = location.hash.slice(1) || 'browse';
let filters = defaultFilters();
let search = '';
let toastTimer;
let modalTrigger;
let refreshAfterDialog = false;

try {
  store.user = sessionStorage.getItem(accountKey) || store.user;
} catch { /* The default demo student remains available. */ }

function adopt(state) {
  if ((state.dataRevision ?? 0) < (store.dataRevision ?? 0)) return;
  const previousStudent = store.user;
  state.user = student(state, previousStudent) ? previousStudent : 'anika';
  store = state;
  if (store.user !== previousStudent) chooseStudent(store.user);
}

async function commit(change, user = store.user) {
  const { state, result } = await accessDemo(state => {
    if (user !== store.user || !student(state, user)) throw new Error('The demo student changed. Reopen this action for the current student.');
    state.user = user;
    return change(state);
  });
  adopt(state);
  if (updateChannel) updateChannel.postMessage(state.dataRevision);
  else {
    try { localStorage.setItem(updateKey, String(state.dataRevision)); } catch { /* This tab already has the committed state. */ }
  }
  return result;
}

async function refresh() {
  adopt((await accessDemo()).state);
}

const listingById = (key, state = store) => state.listings.find(item => item.id === key);
const requestById = (key, state = store) => state.requests.find(request => request.id === key && [request.owner, request.borrower].includes(state.user));
const postById = (key, state = store) => state.wanted.find(post => post.id === key);
const categoryOptions = selected => optionList(Object.entries(categories).map(([value, category]) => [value, category.name]), selected);
const hostOptions = selected => optionList([['','Any hostel'], ...Object.entries(hostels).map(([value, hostel]) => [value, hostel.name])], selected);
const pickupOptions = selected => optionList(meetingSpots.map(spot => [spot, spot]), selected);
const select = (name, options, extra = '') => `<select name="${name}" ${extra}>${options}</select>`;
const input = (name, attrs) => `<input name="${name}" ${attrs}>`;
const money = (name, value, attrs = '', minimum = 0) => input(name, `type="number" inputmode="decimal" min="${minimum}" max="100000" step="0.01" value="${escape(value)}" ${attrs}`);
const quantityInput = (value, min = 1) => input('quantity', `required type="number" inputmode="numeric" min="${min}" step="1" value="${value}"`);
const textarea = (name, value, placeholder, max = 500) => `<textarea name="${name}" required rows="3" maxlength="${max}" placeholder="${escape(placeholder)}">${escape(value)}</textarea>`;
const clean = (data, key) => String(data.get(key) ?? '').trim();
const requireText = (data, key, message) => {
  const value = clean(data, key);
  if (!value) throw new Error(message);
  return value;
};

function render() {
  document.documentElement.dataset.theme = store.theme;
  document.querySelector('meta[name="theme-color"]').content = store.theme === 'dark' ? '#171624' : '#f9f8fc';
  const [page, key, subpage] = route.split('/');
  let content;
  switch (page) {
    case 'browse': content = browse(store, filters, search); break;
    case 'item': content = itemPage(store, listingById(key)); break;
    case 'listings': content = myListings(store); break;
    case 'wishlist': content = wishlist(store); break;
    case 'requests': content = requestsPage(store, key); break;
    case 'request': content = requestPage(store, requestById(key)); break;
    case 'wanted': content = key && key !== 'mine' ? wantedPage(store, postById(key)) : wantedBoard(store, key); break;
    case 'hostels': content = hostelsPage(store, key, subpage); break;
    case 'notifications': content = notificationsPage(store); break;
    case 'profile': content = profilePage(store); break;
    default: content = missing();
  }
  const active = document.activeElement;
  const actionName = active?.dataset?.action;
  const actionId = active?.dataset?.id;
  root.innerHTML = layout(store, route, content, search);
  root.querySelector('#toast-slot').replaceWith(toast);
  if (actionName) {
    [...root.querySelectorAll('[data-action]')].find(element => element.dataset.action === actionName && element.dataset.id === actionId && element.getClientRects().length)?.focus({ preventScroll: true });
  }
}

function go(destination) {
  if (route === destination) {
    render();
    return;
  }
  location.hash = destination;
}

function showToast(message, error = false) {
  clearTimeout(toastTimer);
  toast.className = error ? 'error show' : 'show';
  toast.innerHTML = `${icon(error ? 'info' : 'check', 20)}<span>${escape(message)}</span>`;
  toastTimer = setTimeout(() => { toast.className = ''; toast.innerHTML = ''; }, 4200);
}

function openDialog(title, body, lead = '') {
  if (!dialog.open) modalTrigger = document.activeElement;
  dialog.innerHTML = `<div class="dialog-header"><div><h2 id="modal-title">${title}</h2>${lead ? `<p>${lead}</p>` : ''}</div><button type="button" class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('x',20)}</button></div>${body}`;
  if (!dialog.open) dialog.showModal();
  else dialog.querySelector('[data-action="close-modal"]').focus();
  dialog.scrollTop = 0;
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function dialogForm(kind, fields, label, key = '', extra = '') {
  return `<form data-form="${kind}" ${key ? `data-id="${escape(key)}"` : ''}><div class="dialog-fields">${fields}</div>${extra}<p class="form-error" role="alert" hidden></p><div class="dialog-footer">${action('Cancel','close-modal',{ style:'secondary' })}<button type="submit" class="button primary">${label}</button></div></form>`;
}

function accountDialog() {
  const options = Object.entries(students(store)).map(([key, person]) => {
    const current = store.user === key;
    return `<button type="button" class="account-option ${current ? 'current' : ''}" data-action="switch-user" data-id="${key}" ${current ? 'aria-current="true"' : ''}>${avatar(store, key)}<span><strong>${escape(person.name)}</strong><small>${hostelName(store, key)}${person.email ? ` · ${escape(person.email)}` : ''}</small></span>${current ? icon('check',20) : ''}</button>`;
  }).join('');
  const controls = action('Reset demo', 'reset-demo', { style: 'secondary' }) + action('Add demo student', 'add-student');
  openDialog('Switch demo student', `<div class="account-list">${options}</div><div class="dialog-footer">${controls}</div>`, 'Choose a fictional account to try the other side of an exchange.');
}

function studentDialog() {
  const fields = field('Student name', input('name', 'required maxlength="60" autocomplete="off"'), true) +
    field('Campus email', input('email', `required type="email" maxlength="254" autocomplete="off" placeholder="alex@${demoEmailDomain}"`), true) +
    field('Hostel', select('hostel', optionList([['', 'Choose a hostel'], ...Object.entries(hostels).map(([key, hostel]) => [key, hostel.name])]), 'required'), true);
  openDialog('Add demo student', dialogForm('student', fields, 'Create demo student'), `Use a fictional @${demoEmailDomain} address for this browser’s demo.`);
}

async function createStudent(data) {
  const key = await commit(state => addDemoStudent(state, { name: clean(data, 'name'), email: clean(data, 'email'), hostel: clean(data, 'hostel') }));
  chooseStudent(key);
  closeDialog();
  go('profile');
  showToast('Demo student created.');
}

function chooseStudent(key) {
  store.user = key;
  try { sessionStorage.setItem(accountKey,key); } catch { /* Current tab state is still usable. */ }
}

function resetDialog() {
  openDialog('Reset demo?', `<form data-form="reset-demo"><p class="confirm-text">This clears your changes in this browser and restores the original students, listings, requests, and settings.</p><p class="form-error" role="alert" hidden></p><div class="dialog-footer">${action('Go back', 'accounts', { style: 'secondary' })}<button class="button primary" type="submit">Reset demo</button></div></form>`);
}

async function resetDemo() {
  await commit(state => Object.assign(state, seed()));
  chooseStudent('anika');
  filters = defaultFilters();
  search = '';
  closeDialog();
  go('browse');
  showToast('Demo reset. You’re now Anika Rao.');
}

function filterDialog() {
  const fields = field('Listing type', select('mode', optionList([['','Any type'], ...Object.entries(modes).map(([key, mode]) => [key, mode.form])], filters.mode))) +
    field('Hostel', select('hostel', hostOptions(filters.hostel))) + field('Maximum price (₹)', money('price', filters.price, 'placeholder="Any price"'), true);
  openDialog('Filter listings', dialogForm('filters', fields, 'Apply filters'));
}

function listingDialog(item) {
  if (item && (item.owner !== store.user || item.deleted)) return;
  const entry = item ?? { title:'', mode:'lend', category:'', condition:'Good', photo:'', description:'', price:0, maxDays:7, deposit:0, quantity: 1 };
  const exclusive = !!item && store.requests.some(request => request.listing === item.id && isOpenRequest(request));
  const basics = field('Item name', input('title', `required maxlength="70" placeholder="e.g. Scientific calculator" value="${escape(entry.title)}"`), true) +
    field('Share type', exclusive ? `${select('mode-display', optionList([[entry.mode,modes[entry.mode].form]],entry.mode),'disabled')}<input type="hidden" name="mode" value="${entry.mode}">` : select('mode', optionList(Object.entries(modes).map(([key, mode]) => [key, mode.form]),entry.mode))) +
    field('Category', select('category', optionList([['','Choose a category']], entry.category) + categoryOptions(entry.category), 'required')) +
    field('Condition', select('condition', optionList(conditions.map(value => [value,value]),entry.condition))) +
    field(modes[entry.mode].timed ? 'Total units' : 'Units in stock', quantityInput(units(entry), units(entry) === 0 ? 0 : 1)) +
    field('Photo (optional)', `<span class="file-field">${icon('camera',18)}<span id="photo-label">${entry.photo ? 'Replace photo' : 'Choose a photo'}</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"></span>`, true) +
    `<div class="mode-fields wide" id="mode-fields">${listingModeFields(entry.mode,entry)}</div>` +
    field('Description', textarea('description',entry.description,'Anything a student should know before asking?'),true) +
    (item ? `<input type="hidden" name="version" value="${listingVersion(item)}">` : '<div class="wide" id="duplicate-listings" hidden></div>');
  openDialog(item ? 'Edit listing' : 'List an item', dialogForm('listing', basics, item ? 'Save changes' : 'Publish listing', item?.id), item ? 'Stock includes units already promised to borrowers or buyers.' : `Your listing will appear under ${hostelName(store, store.user)}.`);
}

function listingModeFields(mode, entry) {
  const price = mode === 'rent' || mode === 'sell' ? field(mode === 'rent' ? 'Price per unit per day (₹)' : 'Asking price per unit (₹)', money('price', entry.price || '', 'required placeholder="0"', .01)) : '';
  return price + (modes[mode].timed ? field('Maximum loan days', input('maxDays', `required type="number" inputmode="numeric" min="1" max="90" value="${entry.maxDays || 7}"`)) + field('Refundable deposit per unit (₹)', money('deposit', entry.deposit || '', 'placeholder="0"')) : '');
}

function requestDialog(item) {
  if (!item?.active || item.deleted || item.owner === store.user) return;
  const existing = openRequestFor(store, item.id);
  if (existing) { go(`request/${existing.id}`); return; }
  const mode = modes[item.mode];
  const date = day(1);
  const maxDate = day(bookingDays);
  const dates = mode.timed ? field('Pickup date', input('start', `required type="date" min="${day()}" max="${maxDate}" value="${date}" aria-describedby="availability-feedback"`)) + field('Return date', input('end', `required type="date" min="${date}" max="${maxDate}" value="${date}" aria-describedby="availability-feedback"`)) : '';
  const offer = item.mode === 'sell' ? field('Offer per unit (₹)', money('offer', item.price, 'required', .01)) : '';
  const fields = `<div class="request-preview wide">${photo(item,'row-image')}<div><strong>${escape(item.title)}</strong><small>${hostelName(store, item.owner)} · ${modes[item.mode].label}</small></div><strong class="preview-price">${priceLabel(item)}</strong></div>` +
    field('How many?', quantityInput(1), !offer) + offer + dates +
    `<input type="hidden" name="quote" value="${escape(quote(item))}"><div class="availability wide"><div id="stock-preview"></div><div id="booked-dates"></div><div id="availability-feedback" aria-live="polite"></div><div id="available-dates-action"></div></div>` +
    field('Pickup spot', select('pickup',pickupOptions(hostels[student(store, item.owner).hostel].pickup),'required'),true) +
    field('Message', textarea('body','','Introduce yourself and share when you can meet.',280),true);
  openDialog(mode.action, dialogForm('request', fields, item.mode === 'sell' ? 'Send offer' : 'Send request', item.id, `<div class="dialog-summary" id="live-total">${costSummary({ ...item, start:date, end:date, offer:item.price })}</div>`), mode.timed ? `Choose dates in the next ${bookingDays} days for a loan of up to ${item.maxDays} ${item.maxDays === 1 ? 'day' : 'days'}.` : 'Choose a pickup spot and send a message to the owner.');
  const form = dialog.querySelector('form');
  form.dataset.mode = item.mode;
  updateRequestForm(form);
}

function updateRequestForm(form) {
  const item = listingById(form.dataset.id);
  const submit = form.querySelector('[type=submit]');
  const status = form.querySelector('#availability-feedback');
  const next = form.querySelector('#available-dates-action');
  let warning = '';
  if (!item?.active || item.deleted) warning = 'This listing is currently unavailable.';
  else if (item.mode !== form.dataset.mode) warning = 'The share type changed. Close and reopen the request to see the current terms.';
  else if (openRequestFor(store, item.id)) warning = 'You already have an open request for this listing.';
  if (warning) {
    submit.disabled = true;
    status.className = 'availability-warning';
    status.textContent = warning;
    next.innerHTML = '';
    return;
  }
  const start = form.elements.start?.value;
  const end = form.elements.end?.value;
  const quantity = Number(form.elements.quantity.value);
  const validQuantity = Number.isSafeInteger(quantity) && quantity > 0;
  const timed = modes[item.mode].timed;
  const today = day();
  const bookings = timed ? reservationRanges(store.requests, item.id).filter(booking => !booking.end || booking.end >= today) : [];
  const windows = reservationWindows(bookings);
  form.elements.quote.value = quote(item);
  form.querySelector('.preview-price').innerHTML = priceLabel(item);
  form.querySelector('#live-total').innerHTML = costSummary({ ...item, quantity: validQuantity ? quantity : 0, start, end, offer: form.elements.offer?.value });
  form.querySelector('#stock-preview').innerHTML = inventoryDetails(item, store.requests);
  const booked = form.querySelector('#booked-dates');
  booked.innerHTML = timed ? `<strong>Booked dates</strong>${windows.length ? `<ul>${windows.map(window => {
    const start = window.start < today ? today : window.start;
    const range = window.end ? formatDateRange(start, window.end) : `${formatDay(start)} onward, until overdue stock returns`;
    return `<li>${range} · ${Math.max(0, units(item) - window.quantity)} of ${units(item)} free</li>`;
  }).join('')}</ul>` : '<p>No upcoming bookings.</p>'}` : '';
  const duration = dayCount(start, end);
  if (!validQuantity) warning = 'Enter a whole number of units.';
  else if (timed) warning = loanDateError(item, start, end);
  const conflict = !warning && stockConflict(item, { start, end, quantity }, store.requests);
  if (conflict) warning = `${clashLabel(store, conflict)}. ${timed ? 'Choose fewer units or a different range.' : 'Choose a smaller quantity.'}`;
  submit.disabled = !!warning || !!form.dataset.busy;
  const available = warning || `${unitLabel(quantity)} available${timed ? ' for your dates' : ' for pickup'}.`;
  status.className = warning ? 'availability-warning' : 'availability-clear';
  if (status.textContent !== available) status.textContent = available;

  const suggestion = timed && conflict ? firstAvailableDates(start, duration, bookings, quantity, units(item)) : null;
  next.innerHTML = suggestion && suggestion.start !== start && suggestion.end <= day(bookingDays) ? `<p>First free dates from your pickup date</p>${action(`Use ${formatDateRange(suggestion.start, suggestion.end)}`, 'use-free-dates', { style: 'secondary', data: `${suggestion.start}/${suggestion.end}`, glyph: 'calendar' })}` : '';
}

function wantedDialog() {
  const fields = field('What are you looking for?',input('title','required maxlength="70" placeholder="e.g. Lab goggles for chemistry"'),true) +
    field('Category',select('category',optionList([['','Choose a category']]) + categoryOptions(),'required')) +
    field('Needed by',input('needed',`required type="date" min="${day()}" value="${day(2)}"`)) +
    field('Details',textarea('description','','Tell students what would help and when you can pick it up.'),true);
  openDialog('Post a wanted',dialogForm('wanted',fields,'Publish wanted post'),'Students across campus can offer to help.');
}

function offerDialog(post) {
  if (!post || post.closed || post.owner === store.user) return;
  const fields = field('Pickup spot',select('pickup',pickupOptions(hostels[student(store, store.user).hostel].pickup),'required'),true) +
    field('Message',textarea('body','','Describe what you can share and when you’re available.',280),true);
  openDialog('Offer to help',dialogForm('offer',fields,'Send offer',post.id),`Send an offer to ${firstName(store, post.owner)}.`);
}

function ratingDialog(request) {
  if (!request || request.status !== 'returned' || request.ratings[store.user]) return;
  const other = request.owner === store.user ? request.borrower : request.owner;
  const stars = `<fieldset class="star-field wide"><legend>Rating</legend><div>${[1,2,3,4,5].map(value => `<label><input type="radio" required name="stars" value="${value}" aria-label="${value} ${value === 1 ? 'star' : 'stars'}"><span>${icon('star',29)}</span></label>`).join('')}</div></fieldset>`;
  const comments = field('Review (optional)', '<textarea name="body" rows="3" maxlength="280" placeholder="How did the exchange go?"></textarea>',true);
  openDialog('Rate this exchange',dialogForm('rating',stars + comments,'Submit rating',request.id),`How was your exchange with ${firstName(store, other)}?`);
}

function changeStatusDialog(request, next) {
  if (!request) return;
  const label = next === 'declined' ? 'Decline request' : 'Cancel request';
  openDialog(label, `<form data-form="change-status" data-id="${request.id}" data-next="${next}"><p class="confirm-text">The other student will be notified and this exchange will end.</p><p class="form-error" role="alert" hidden></p><div class="dialog-footer">${action('Go back','close-modal',{ style:'secondary' })}<button class="button primary" type="submit">${label}</button></div></form>`);
}

function deleteListingDialog(key) {
  const item = listingById(key);
  if (!item || item.deleted || item.owner !== store.user) throw new Error('This listing is unavailable.');
  if (store.requests.some(request => request.listing === key && isOpenRequest(request))) throw new Error('Finish or close all open requests before deleting this listing.');
  openDialog('Delete listing?', `<form data-form="delete-listing" data-id="${escape(key)}"><p class="confirm-text">Remove ${escape(item.title)} from the marketplace? Past exchanges will remain in your history.</p><input type="hidden" name="version" value="${listingVersion(item)}"><p class="form-error" role="alert" hidden></p><div class="dialog-footer">${action('Cancel', 'close-modal', { style: 'secondary' })}<button class="button primary" type="submit">Delete listing</button></div></form>`);
}

async function deleteListing(key, data) {
  await commit(state => changeListingState(state, key, Number(data.get('version')), 'delete'));
  closeDialog();
  go('listings');
  showToast('Listing deleted.');
}

async function updateStatus(key, next) {
  const result = await commit(state => {
    const request = requestById(key,state);
    if (!request) throw new Error('This request is unavailable.');
    const declined = moveRequest(state,request,next);
    return { status: requestStatus(request).name, declined };
  });
  closeDialog();
  render();
  const count = result.declined;
  showToast(count ? `${result.status}. ${count} ${count === 1 ? 'request no longer fit and was' : 'requests no longer fit and were'} declined.` : `Request updated · ${result.status}`);
}

async function uploadPhoto(file) {
  if (!file?.size) return '';
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) || file.size > 15 * 1024 * 1024) throw new Error('Choose a JPG, PNG, WebP, GIF, or AVIF image under 15 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const scale = Math.min(1, 880 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#faf9f7';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',0.77);
  } catch {
    throw new Error('This photo could not be opened. Try another image.');
  } finally { URL.revokeObjectURL(source); }
}

async function saveListing(key, data, form) {
  const actor = store.user;
  const draft = {
    title: clean(data, 'title'), description: clean(data, 'description'), category: clean(data, 'category'),
    condition: clean(data, 'condition'), mode: clean(data, 'mode'), quantity: Number(data.get('quantity')),
    price: Number(data.get('price')), maxDays: Number(data.get('maxDays')), deposit: Number(data.get('deposit')),
    photo: await uploadPhoto(data.get('photo')),
  };
  if (!dialog.open || dialog.querySelector('form') !== form) return;
  const duplicate = clean(data, 'duplicate');
  const result = await commit(state => writeListing(state, draft, { key, version: Number(data.get('version')), duplicate }), actor);
  if (result.matches) {
    const choices = form.querySelector('#duplicate-listings');
    choices.innerHTML = `<fieldset><legend>You already listed this item</legend><p>Add ${unitLabel(draft.quantity)} to an existing listing and keep its terms, or create a separate listing.</p>${result.matches.map(item => `<label><input type="radio" required name="duplicate" value="${escape(item.id)}"><span><strong>Add to ${escape(item.title)}</strong><small>${modes[item.mode].form} · ${unitLabel(units(item))} in stock</small></span></label>`).join('')}<label><input type="radio" required name="duplicate" value="separate"><strong>Post separately</strong></label></fieldset>`;
    choices.hidden = false;
    form.querySelector('[type=submit]').textContent = 'Continue';
    choices.querySelector('input').focus();
    return;
  }
  closeDialog();
  go(`item/${result.id}`);
  showToast(result.merged ? `Added ${unitLabel(draft.quantity)} to your existing listing.` : key ? 'Listing updated.' : 'Your listing is live.');
}

async function sendRequest(key, data) {
  const requestKey = await commit(state => createRequest(state, key, { body: clean(data, 'body'), pickup: clean(data, 'pickup'),
    start: clean(data, 'start'), end: clean(data, 'end'), quantity: Number(data.get('quantity')), offer: Number(data.get('offer')), quote: clean(data, 'quote') }));
  closeDialog();
  go(`request/${requestKey}`);
  showToast('Request sent.');
}

async function sendMessage(key, data) {
  const body = requireText(data,'body','Write a message before sending.');
  await commit(state => {
    const request = requestById(key,state);
    if (!request || requestIsExpired(request) || ['cancelled','declined'].includes(request.status)) throw new Error('This conversation has closed.');
    request.messages.push({ user:state.user, body, at:stamp() });
    notifyUser(state,request.owner === state.user ? request.borrower : request.owner,`New message from ${firstName(state, state.user)}`,body,`request/${request.id}`);
  });
  render();
  document.querySelector('#message')?.focus({ preventScroll: true });
  showToast('Message sent.');
}

async function sendRating(key, data) {
  await commit(state => {
    const request = requestById(key,state);
    if (!request || request.status !== 'returned' || request.ratings[state.user]) throw new Error('This exchange has already been rated or is still in progress.');
    const stars = Number(data.get('stars'));
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Choose a rating from one to five stars.');
    const recipient = request.owner === state.user ? request.borrower : request.owner;
    request.ratings[state.user] = { recipient, stars, body:clean(data,'body'), at:stamp() };
    notifyUser(state,recipient,`${firstName(state, state.user)} rated your exchange`,'Your reputation has been updated.',`request/${key}`);
  });
  closeDialog();
  render();
  showToast('Thanks for rating your exchange.');
}

async function publishWanted(data) {
  const post = { id:id(), owner:store.user, title:requireText(data,'title','Describe what you are looking for.'), description:requireText(data,'description','Add some details about what you need.'), category:clean(data,'category'), needed:clean(data,'needed'), closed:false, offers:[], at:stamp() };
  if (!Object.hasOwn(categories, post.category) || !validDate(post.needed) || post.needed < day()) throw new Error('Choose a category and a date today or later.');
  await commit(state => state.wanted.unshift(post));
  closeDialog();
  go(`wanted/${post.id}`);
  showToast('Wanted post published.');
}

async function sendOffer(key,data) {
  const body = requireText(data,'body','Add a message to your offer.');
  const pickup = clean(data,'pickup');
  if (!meetingSpots.includes(pickup)) throw new Error('Choose a pickup spot.');
  await commit(state => {
    const post = postById(key,state);
    if (!post || post.closed || post.owner === state.user || post.offers.some(offer => offer.user === state.user)) throw new Error('This wanted post cannot receive another offer from you.');
    post.offers.push({ id:id(), user:state.user, body, pickup, status:'offered', at:stamp() });
    notifyUser(state,post.owner,`${firstName(state, state.user)} offered to help`,post.title,`wanted/${key}`);
  });
  closeDialog();
  render();
  showToast('Offer sent.');
}

async function completeWanted(key, offerId) {
  await commit(state => {
    const post = postById(key,state);
    if (!post || post.closed || post.owner !== state.user) throw new Error('This post is already fulfilled.');
    const offer = post.offers.find(item => item.id === offerId);
    if (offerId && offer?.status !== 'offered') throw new Error('This offer is unavailable.');
    if (offer) offer.status = 'accepted';
    post.closed = true;
    for (const other of post.offers) {
      notifyUser(state,other.user,other === offer ? `${firstName(state, state.user)} accepted your offer` : `${firstName(state, state.user)} fulfilled a wanted post`,post.title,`wanted/${key}`);
    }
  });
  render();
  showToast(offerId ? 'Offer accepted and post marked fulfilled.' : 'Wanted post marked fulfilled.');
}

const clickActions = {
  skip: () => document.querySelector('#main-content').focus(),
  explore: () => document.querySelector('#explore').scrollIntoView({ behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }),
  filters: filterDialog,
  category: key => { filters.category = key; render(); },
  'clear-extra': () => { Object.assign(filters,{ mode:'',hostel:'',price:'' }); render(); },
  'clear-filters': () => { filters = defaultFilters(); search = ''; render(); },
  accounts: accountDialog,
  'add-student': studentDialog,
  'switch-user': key => {
    if (!student(store, key)) return;
    chooseStudent(key);
    closeDialog();
    if (route.startsWith('request/') && !requestById(route.split('/')[1])) go('requests');
    else render();
    showToast(`Switched to ${student(store, key).name}.`);
  },
  'reset-demo': resetDialog,
  theme: async () => { await commit(state => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; }); render(); showToast(`${store.theme === 'dark' ? 'Dark' : 'Light'} theme enabled.`); },
  'new-listing': () => listingDialog(),
  'edit-listing': key => { const item = listingById(key); if (item) listingDialog(item); },
  'delete-listing': deleteListingDialog,
  'toggle-listing': async (key, element) => {
    const active = await commit(state => changeListingState(state, key, Number(element.dataset.version), element.dataset.next));
    render();
    showToast(active ? 'Listing resumed.' : 'Listing paused.');
  },
  save: async key => {
    const saved = await commit(state => {
      const item = listingById(key,state);
      if (!item || item.deleted || item.owner === state.user) throw new Error('This listing cannot be saved.');
      const list = state.saved[state.user] ??= [];
      const index = list.indexOf(key);
      if (index !== -1) list.splice(index,1);
      else list.unshift(key);
      return index === -1;
    });
    render();
    showToast(saved ? 'Added to your wishlist.' : 'Removed from your wishlist.');
  },
  'request-item': key => requestDialog(listingById(key)),
  'use-free-dates': key => {
    const form = dialog.querySelector('[data-form="request"]');
    const [start, end] = key.split('/');
    form.elements.start.value = start;
    form.elements.end.min = start;
    form.elements.end.value = end;
    form.elements.start.focus({ preventScroll: true });
    updateRequestForm(form);
  },
  'move-request': (key, element) => ['declined','cancelled'].includes(element.dataset.next) ? changeStatusDialog(requestById(key),element.dataset.next) : updateStatus(key,element.dataset.next),
  rate: key => ratingDialog(requestById(key)),
  'new-wanted': wantedDialog,
  'help-wanted': key => offerDialog(postById(key)),
  'close-wanted': key => completeWanted(key),
  'accept-offer': (key,element) => completeWanted(key,element.dataset.offer),
  'read-all': async () => { await commit(state => { state.notifications.filter(note => note.user === state.user).forEach(note => { note.read = true; }); }); render(); showToast('All notifications marked as read.'); },
  'read-note': async key => {
    const destination = await commit(state => {
      const note = state.notifications.find(note => note.id === key && note.user === state.user);
      if (!note) throw new Error('This notification is unavailable.');
      note.read = true;
      return note.route;
    });
    go(destination);
  },
  'close-modal': closeDialog,
};

const submitActions = {
  filters: (_,data) => { Object.assign(filters,{ mode:clean(data,'mode'),hostel:clean(data,'hostel'),price:clean(data,'price') }); closeDialog(); render(); showToast('Filters applied.'); },
  listing: saveListing,
  request: sendRequest,
  message: sendMessage,
  rating: sendRating,
  wanted: (_,data) => publishWanted(data),
  offer: sendOffer,
  'change-status': (key,_data,form) => updateStatus(key,form.dataset.next),
  'delete-listing': deleteListing,
  'reset-demo': resetDemo,
  student: (_, data) => createStudent(data),
};

document.addEventListener('click', async event => {
  const element = event.target.closest('[data-action]');
  if (!element) return;
  const handler = clickActions[element.dataset.action];
  if (!handler) return;
  event.preventDefault();
  const transitionButton = element.dataset.action === 'move-request' && !['declined', 'cancelled'].includes(element.dataset.next);
  if (transitionButton && element.disabled) return;
  if (transitionButton) element.disabled = true;
  try { await handler(element.dataset.id,element); }
  catch (error) {
    if (['move-request', 'toggle-listing', 'delete-listing'].includes(element.dataset.action) && !dialog.open) {
      await refresh().then(render).catch(() => {});
    }
    showToast(error.message,true);
  } finally { if (transitionButton) element.disabled = false; }
});

document.addEventListener('submit', async event => {
  const form = event.target;
  if (form.id === 'site-search') {
    event.preventDefault();
    search = form.querySelector('input').value;
    const reveal = () => document.querySelector('#explore')?.scrollIntoView({ block:'start' });
    if (route === 'browse') reveal();
    else { window.addEventListener('hashchange', reveal, { once:true }); go('browse'); }
    return;
  }
  const handler = submitActions[form.dataset.form];
  if (!handler) return;
  event.preventDefault();
  if (form.dataset.busy) return;
  form.dataset.busy = 'true';
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  const errorBox = form.querySelector('.form-error');
  if (errorBox) errorBox.hidden = true;
  try { await handler(form.dataset.id,new FormData(form),form); }
  catch (error) {
    const message = error.name === 'QuotaExceededError' ? 'This browser’s demo storage is full. Try a smaller photo.' : error.message;
    if (form.dataset.form === 'request') await refresh().catch(() => {});
    if (errorBox) { errorBox.textContent = message; errorBox.hidden = false; }
    else showToast(message,true);
  } finally {
    button.disabled = false;
    delete form.dataset.busy;
    if (dialog.open && form.dataset.form === 'request' && form.isConnected) updateRequestForm(form);
  }
});

document.addEventListener('input', event => {
  const input = event.target;
  if (input.name === 'title' && input.form?.dataset.form === 'listing') {
    const choices = input.form.querySelector('#duplicate-listings');
    if (choices && !choices.hidden) {
      choices.hidden = true;
      choices.innerHTML = '';
      input.form.querySelector('[type=submit]').textContent = 'Publish listing';
    }
  }
  if (input.type === 'search' && input.form?.id === 'site-search') {
    search = input.value;
    const results = document.querySelector('#browse-results');
    if (results) results.innerHTML = browseResults(store,filters,search);
  }
  const form = input.closest('[data-form="request"]');
  if (!form || !['start','end','offer','quantity'].includes(input.name)) return;
  const start = form.elements.start;
  const end = form.elements.end;
  if (input === start) {
    end.min = start.value || day();
    if (!end.value || end.value < end.min) end.value = end.min;
  }
  updateRequestForm(form);
});

document.addEventListener('change', event => {
  const field = event.target;
  if (field.id === 'sort') { filters.sort = field.value; document.querySelector('#browse-results').innerHTML = browseResults(store,filters,search); }
  if (field.name === 'mode' && field.form?.dataset.form === 'listing') {
    const entry = Object.fromEntries(new FormData(field.form));
    document.querySelector('#mode-fields').innerHTML = listingModeFields(field.value,entry);
    field.form.elements.quantity.closest('label').firstElementChild.textContent = modes[field.value].timed ? 'Total units' : 'Units in stock';
  }
  if (field.name === 'photo') document.querySelector('#photo-label').textContent = field.files[0]?.name ?? 'Choose a photo';
});

window.addEventListener('hashchange', () => {
  route = location.hash.slice(1) || 'browse';
  closeDialog();
  render();
  window.scrollTo(0,0);
  document.querySelector('#main-content').focus({ preventScroll:true });
});

async function refreshIfChanged() {
  try { await refresh(); } catch { return; }
  if (dialog.open) {
    refreshAfterDialog = true;
    const form = dialog.querySelector('[data-form="request"]');
    if (form) updateRequestForm(form);
  } else if (!document.querySelector('#message:focus')) render();
}

if (updateChannel) updateChannel.addEventListener('message', refreshIfChanged);
else window.addEventListener('storage', event => { if (event.key === updateKey) refreshIfChanged(); });

dialog.addEventListener('close', () => {
  if (modalTrigger?.isConnected) modalTrigger.focus({ preventScroll:true });
  modalTrigger = null;
  if (refreshAfterDialog) { refreshAfterDialog = false; render(); }
});

try {
  await refresh();
  render();
} catch {
  if (!student(store, store.user)) chooseStudent('anika');
  render();
  showToast('Demo storage is unavailable in this browser. Open CampusShare where browser storage is enabled to make changes.', true);
}
