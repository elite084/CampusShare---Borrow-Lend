import { hostels, student, students, categories, modes, initials, currency, reputation, requestStatus, requestIsExpired, requestActions, requestTotal, formatDay, formatDateRange, formatTime, stockConflict, clashLabel, stockSummary, units, unitLabel, listingVersion, openRequestFor } from './data.mjs';

const paths = {
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>',
  wanted: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M12 7v6m-3-3h6"/>',
  hostel: '<path d="M4 21h16M6 21V5l12-2v18M9 8h1m4-1h1m-6 5h1m4-1h1m-6 5h1m4-1h1m-4 6v-2h2v2"/>',
  box: '<path d="M3 7.5 12 2l9 5.5v9L12 22l-9-5.5v-9Z"/><path d="m3 7.5 9 5.5 9-5.5M12 13v9M7.5 4.75l9 5.5"/>',
  exchange: '<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>',
  heart: '<path d="M20.8 4.7a5.1 5.1 0 0 0-7.2 0L12 6.3l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2l1.6 1.6L12 21l7.2-7.5 1.6-1.6a5.1 5.1 0 0 0 0-7.2Z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.3 15.3 4.2 4.2"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9m-8 12a2 2 0 0 0 4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.8 14.3A9 9 0 0 1 9.7 3.2 9 9 0 1 0 20.8 14.3Z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="M20 12H4m7 7-7-7 7-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 7h8m-8 4h1m3 0h1m3 0h.1M8 15h1m3 0h1m3 0h.1M8 18h1m3 0h1m3 0h.1"/>',
  bike: '<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="m5 17 4-8 4 8H5m8 0 3-7m3 7-3-11h-3m-6 3h4"/>',
  book: '<path d="M12 6.5C9 4 5 4 2.5 5v13c3-1 6.5-1 9.5 1.5 3-2.5 6.5-2.5 9.5-1.5V5C19 4 15 4 12 6.5Zm0 0v13"/>',
  shirt: '<path d="m16 4 5 2.5 1 5-4 1V21H6v-8.5l-4-1 1-5L8 4a4 4 0 0 0 8 0Z"/>',
  cup: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h2a2.5 2.5 0 0 1 0 5h-2M8 2v3m5-3v3M2 21h18"/>',
  filter: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--surface, white)"/><circle cx="15" cy="12" r="2" fill="var(--surface, white)"/><circle cx="10" cy="18" r="2" fill="var(--surface, white)"/>',
  pin: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/>',
  star: '<path d="m12 2.8 2.8 5.75 6.35.9-4.6 4.47 1.1 6.3L12 17.25l-5.65 2.97 1.1-6.3-4.6-4.47 6.35-.9L12 2.8Z"/>',
  user: '<circle cx="12" cy="7.2" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9M15 3.1a4 4 0 0 1 0 7.8"/><circle cx="9" cy="7" r="4"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  shield: '<path d="M12 22c4-2 8-5 8-10V5l-8-3-8 3v7c0 5 4 8 8 10Z"/><path d="m8.5 12 2.3 2.3 4.7-4.7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h1m10 0h1"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="3.5"/>',
  chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L4 20.5l1.3-4.4A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 12h.1m3.4 0h.1m3.4 0h.1"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1 12-12a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
};

export const icon = (name, size = 20) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.box}</svg>`;
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function avatar(store, key, size = '') {
  const person = student(store, key);
  return `<span class="avatar ${person.tone} ${size}" aria-hidden="true">${escape(initials(person.name))}</span>`;
}
export const badge = (text, color = 'neutral') => `<span class="badge ${color}">${escape(text)}</span>`;
export const action = (text, handler, { style = 'primary', glyph = '', data = '', extra = '' } = {}) => `<button class="button ${style}" type="button" data-action="${handler}" ${data ? `data-id="${escape(data)}"` : ''} ${extra}>${glyph ? icon(glyph, 18) : ''}${escape(text)}</button>`;
export const link = (text, href, style = 'secondary', glyph = '') => `<a class="button ${style}" href="#${href}">${glyph ? icon(glyph, 18) : ''}${escape(text)}</a>`;
export const iconButton = (glyph, handler, label, data = '', extra = '') => `<button type="button" class="icon-button ${extra}" data-action="${handler}" ${data ? `data-id="${escape(data)}"` : ''} aria-label="${escape(label)}" title="${escape(label)}">${icon(glyph)}</button>`;
export const optionList = (entries, selected = '') => entries.map(([value, label]) => `<option value="${escape(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escape(label)}</option>`).join('');
export const field = (label, control, wide = false) => `<label class="field${wide ? ' wide' : ''}"><span>${label}</span>${control}</label>`;
export const empty = (glyph, title, body, next = '') => `<div class="empty"><span class="empty-icon">${icon(glyph, 25)}</span><h2>${title}</h2><p>${body}</p>${next}</div>`;
export const back = (href, label) => `<a class="back-link" href="#${href}">${icon('back', 17)}${label}</a>`;
export const heading = (title, body, next = '') => `<div class="page-heading"><div><h1>${escape(title)}</h1><p>${escape(body)}</p></div>${next}</div>`;
export const details = (glyph, label, value) => `<div class="detail-stat">${icon(glyph, 19)}<div><span>${label}</span><strong>${value}</strong></div></div>`;
export function ratingMark(store, id) {
  const { score } = reputation(store, id);
  return score === null ? '<span class="muted">No ratings yet</span>' : `<span class="rating-mark">${icon('star', 14)}${score}</span>`;
}
export const hostelName = (store, key) => hostels[student(store, key).hostel].name;
export const priceLabel = item => item.mode === 'rent' ? `${currency(item.price)}<small>${units(item) === 1 ? '/ day' : '/ unit / day'}</small>` : item.mode === 'sell' ? `${currency(item.price)}${units(item) > 1 ? '<small>/ unit</small>' : ''}` : 'Free';

function listingBadge(item, stock) {
  if (units(item) === 0) return badge(item.mode === 'sell' ? 'Sold' : 'Given away');
  if (modes[item.mode].timed && stock.out === stock.capacity) return badge('On loan', 'blue');
  if (!item.active) return badge('Paused');
  return badge(modes[item.mode].label, modes[item.mode].color);
}

export function inventoryDetails(item, requests, stock = stockSummary(item, requests)) {
  return `<div class="inventory-summary"><strong>${stock.capacity ? `${stock.free} of ${stock.capacity} ${item.active ? 'free now' : 'unreserved'}` : '0 units left'}</strong>${stock.reserved ? `<span>${stock.reserved} reserved for upcoming pickups</span>` : ''}${stock.out ? `<span>${stock.out} on loan</span>` : ''}</div>`;
}

export function photo(item, className = '') {
  return item.photo ? `<img class="${className}" src="${escape(item.photo.startsWith('data:') ? item.photo : `./assets/${item.photo}.jpg`)}" alt="${escape(item.title)}" ${className === 'detail-photo' ? '' : 'loading="lazy"'}>` : `<div class="photo-placeholder ${className} ${categories[item.category].color}" role="img" aria-label="${escape(categories[item.category].name)}">${icon(categories[item.category].icon, 50)}</div>`;
}

export function listingCard(store, item, manage = false) {
  const stock = stockSummary(item, store.requests);
  const saved = (store.saved[store.user] ?? []).includes(item.id);
  return `<article class="listing-card">
    <div class="listing-media">${photo(item)}<a class="media-link" href="#item/${item.id}" aria-label="View ${escape(item.title)}"></a>
      <div class="card-badge">${listingBadge(item, stock)}</div>
      ${item.owner !== store.user ? `<button type="button" class="save-button${saved ? ' saved' : ''}" data-action="save" data-id="${item.id}" aria-label="${saved ? 'Remove from wishlist' : 'Save to wishlist'}" aria-pressed="${saved}">${icon('heart', 19)}</button>` : ''}
    </div>
    <div class="listing-body">
      <div class="listing-title"><h3><a href="#item/${item.id}">${escape(item.title)}</a></h3><strong class="price ${item.mode === 'give' || item.mode === 'lend' ? 'free' : ''}">${priceLabel(item)}</strong></div>
      <div class="listing-meta">${icon('pin', 15)}<span>${hostelName(store, item.owner)}</span><span class="dot"></span><span>${escape(item.condition)}</span></div>
      ${inventoryDetails(item, store.requests, stock)}
      <div class="listing-footer"><span class="owner-mini">${avatar(store, item.owner, 'tiny')}<span>${escape(student(store, item.owner).name)}${item.owner === store.user ? ' (you)' : ''}</span></span>${ratingMark(store, item.owner)}</div>
      ${manage ? `<div class="listing-manage">${action('Edit listing', 'edit-listing', { style: 'secondary', glyph: 'edit', data: item.id })}${stock.capacity ? action(item.active ? 'Pause' : 'Resume', 'toggle-listing', { style: 'secondary', data: item.id, extra: `data-version="${listingVersion(item)}" data-next="${item.active ? 'pause' : 'resume'}"` }) : ''}${action('Delete listing', 'delete-listing', { style: 'text', data: item.id })}</div>` : ''}
    </div>
  </article>`;
}

const grid = cards => `<div class="listing-grid">${cards.join('')}</div>`;

const navItems = [
  ['browse', 'grid', 'Browse'], ['wanted', 'wanted', 'Wanted board'], ['hostels', 'hostel', 'Hostels'],
  ['listings', 'box', 'My listings'], ['requests', 'exchange', 'My requests'], ['wishlist', 'heart', 'Wishlist'],
];

export function layout(store, route, content, search) {
  const [page] = route.split('/');
  const active = { item: 'browse', request: 'requests' }[page] ?? page;
  const unread = store.notifications.filter(n => n.user === store.user && !n.read).length;
  const waiting = store.requests.filter(request => request.owner === store.user && request.status === 'requested' && !requestIsExpired(request)).length;
  const person = student(store, store.user);
  const brand = `<a class="brand" href="#browse"><img src="./assets/mark.svg" alt="" width="36" height="36"><span>Campus<span class="brand-accent">Share</span></span></a>`;
  const nav = ([to, glyph, label]) => `<a href="#${to}" class="nav-link ${active === to ? 'active' : ''}"${active === to ? ' aria-current="page"' : ''}>${icon(glyph, 19)}<span>${label}</span>${to === 'requests' && waiting ? `<span class="nav-count">${waiting}</span>` : ''}</a>`;
  const mobileLink = (to, glyph, label) => `<a class="mobile-link ${active === to ? 'active' : ''}" href="#${to}"${active === to ? ' aria-current="page"' : ''}>${icon(glyph, 21)}<span>${label}</span></a>`;
  return `<a class="skip-link" href="#main-content" data-action="skip">Skip to content</a><aside class="sidebar">
    ${brand}
    <nav aria-label="Main navigation"><span class="nav-label">Marketplace</span>${navItems.slice(0, 3).map(nav).join('')}<span class="nav-label second">Your space</span>${navItems.slice(3).map(nav).join('')}</nav>
    <a class="hostel-shortcut" href="#hostels/${person.hostel}"><span class="hostel-icon">${icon('hostel', 20)}</span><span><small>Your hostel</small><strong>${hostelName(store, store.user)}</strong></span>${icon('right', 16)}</a>
  </aside>
  <div class="shell"><header class="app-header"><div class="topbar">
    <div class="brand-mobile">${brand}</div>
    <form class="searchbar" id="site-search" role="search">${icon('search', 20)}<input type="search" placeholder="Search calculators, cycles, notes…" aria-label="Search listings" value="${escape(search)}" maxlength="100" autocomplete="off"><button class="search-key" type="submit" aria-label="Search">${icon('search', 18)}</button></form>
    <div class="top-actions">${iconButton(store.theme === 'dark' ? 'sun' : 'moon', 'theme', store.theme === 'dark' ? 'Use light theme' : 'Use dark theme', '', 'theme-button')}
    <a class="icon-button notification-button ${active === 'notifications' ? 'active' : ''}" href="#notifications" aria-label="Notifications${unread ? `, ${unread} unread` : ''}" title="Notifications">${icon('bell')}${unread ? '<span class="notification-dot"></span>' : ''}</a>
    <button type="button" class="account-button" data-action="accounts" aria-label="Switch demo student. Current student ${escape(person.name)}" aria-haspopup="dialog"><span class="account-avatar">${avatar(store, store.user)}</span><span class="account-name">${escape(person.name)}<small>Switch demo student</small></span><span class="account-switch-label">Switch</span>${icon('chevron', 15)}</button>
    ${action('List an item', 'new-listing', { glyph: 'plus', extra: 'id="top-list"' })}</div>
  </div><div id="toast-slot"></div></header><main id="main-content" class="content" tabindex="-1">${content}</main></div>
  <nav class="mobile-nav" aria-label="Mobile navigation">${mobileLink('browse','grid','Browse')}${mobileLink('wanted','wanted','Wanted')}<button class="mobile-link mobile-add" data-action="new-listing" type="button"><span>${icon('plus', 23)}</span><span>List item</span></button>${mobileLink('requests','exchange','Requests')}${mobileLink('profile','user','You')}</nav>`;
}

export function matchingListings(store, filters, search) {
  const query = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return store.listings.filter(item => {
    const content = `${item.title} ${item.description} ${categories[item.category].name} ${hostelName(store, item.owner)} ${student(store, item.owner).name}`.toLocaleLowerCase();
    return item.active && !item.deleted && item.owner !== store.user && query.every(word => content.includes(word)) &&
      (!filters.category || filters.category === item.category) && (!filters.mode || filters.mode === item.mode) &&
      (!filters.hostel || filters.hostel === student(store, item.owner).hostel) && (filters.price === '' || item.price <= Number(filters.price));
  }).sort((a, b) => {
    if (filters.sort === 'price-low') return a.price - b.price;
    if (filters.sort === 'price-high') return b.price - a.price;
    if (filters.sort === 'recent') return (b.at ?? '').localeCompare(a.at ?? '');
    return Number(student(store, b.owner).hostel === student(store, store.user).hostel) - Number(student(store, a.owner).hostel === student(store, store.user).hostel);
  });
}

export function browseResults(store, filters, search) {
  const items = matchingListings(store, filters, search);
  return `<p class="result-count" aria-live="polite">${items.length} ${items.length === 1 ? 'item' : 'items'} available${search.trim() ? ` for “${escape(search.trim())}”` : ''}</p>${items.length ? grid(items.map(item => listingCard(store, item))) : empty('search', 'No listings found', 'Try a different search or let your campus know what you need.', `<div class="button-row">${action('Clear search and filters','clear-filters',{ style:'secondary' })}${action('Post a wanted','new-wanted')}</div>`)}`;
}

export function browse(store, filters, search) {
  const count = [filters.mode, filters.hostel, filters.price].filter(value => value !== '').length;
  const demoLink = ['anika', 'rohan'].includes(store.user) ? link('See a booking clash', 'request/demo-clash', 'hero-secondary') : link('See wanted board', 'wanted', 'hero-secondary');
  return `<section class="hero">
    <img class="hero-image" src="./assets/hero.jpg" alt="" fetchpriority="high">
    <div class="hero-content"><div class="hero-place">${icon('pin', 15)}${hostelName(store, store.user)} <span></span> Campus marketplace</div><h1>Borrow more.<br><em>Buy less.</em></h1><p>Find what you need from students in your hostel and across campus.</p><div class="button-row">${action('Explore listings', 'explore')}${demoLink}</div></div>
  </section>
  <section class="browse-section" id="explore" aria-labelledby="explore-title">
    <div class="section-header"><div><h2 id="explore-title">Explore listings</h2><p>Find an item to borrow, rent, buy, or pick up for free.</p></div>
    <div class="browse-controls">${action(count ? `Filters (${count})` : 'Filters', 'filters', { style: 'secondary', glyph: 'filter' })}<label class="sort-control"><span class="sr-only">Sort listings</span><select id="sort">${optionList([['hostel','My hostel first'],['recent','Newest first'],['price-low','Price low to high'],['price-high','Price high to low']], filters.sort)}</select></label></div></div>
    <div class="category-row" aria-label="Categories">${[['','All items','grid'], ...Object.entries(categories).map(([key, category]) => [key, category.name, category.icon])].map(([key, label, glyph]) => `<button type="button" class="category-chip ${filters.category === key ? 'selected' : ''}" data-action="category" data-id="${key}" aria-pressed="${filters.category === key}">${icon(glyph, 16)}${label}</button>`).join('')}</div>
    ${count ? `<div class="active-filters">${filters.mode ? badge(modes[filters.mode].form, 'purple') : ''}${filters.hostel ? badge(hostels[filters.hostel].name, 'purple') : ''}${filters.price !== '' ? badge(`Up to ${currency(filters.price)}`, 'purple') : ''}${action('Clear filters', 'clear-extra', { style: 'text' })}</div>` : ''}
    <div id="browse-results">${browseResults(store, filters, search)}</div>
  </section>`;
}

export function itemPage(store, item) {
  if (!item || item.deleted) return missing('listing');
  const mode = modes[item.mode];
  const mine = item.owner === store.user;
  const saved = (store.saved[store.user] ?? []).includes(item.id);
  const person = student(store, item.owner);
  const reviews = reputation(store, item.owner);
  const stock = stockSummary(item, store.requests);
  const pending = openRequestFor(store, item.id);
  let requestAction = link('Browse other listings','browse');
  if (mine) requestAction = action('Edit listing', 'edit-listing', { glyph: 'edit', data: item.id, extra: 'data-full' });
  else if (pending) requestAction = link('View your request', `request/${pending.id}`, 'primary');
  else if (item.active && (mode.timed || stock.free > 0)) requestAction = action(mode.action, 'request-item', { data: item.id, extra: 'data-full' });
  else if (item.active && stock.reserved) requestAction = '<p class="inline-note">All units are reserved for pickup.</p>';
  return `${back(mine ? 'listings' : 'browse', mine ? 'My listings' : 'Browse listings')}<div class="item-layout">
    <div class="item-main"><div class="panel item-photo-panel">${photo(item, 'detail-photo')}</div><div class="panel description-panel"><h2>About this item</h2><p>${escape(item.description)}</p></div></div>
    <div class="item-side"><section class="panel item-summary"><div class="row-between">${listingBadge(item, stock)}${!mine ? iconButton('heart', 'save', saved ? 'Remove from wishlist' : 'Save to wishlist', item.id, saved ? 'saved' : '') : ''}</div>
    <h1>${escape(item.title)}</h1><div class="item-location">${icon('pin', 17)}${hostelName(store, item.owner)}<span class="dot"></span>${categories[item.category].name}</div><strong class="detail-price">${priceLabel(item)}</strong>
    ${inventoryDetails(item, store.requests, stock)}
    <div class="detail-grid">${details('shield','Condition',escape(item.condition))}${mode.timed ? details('clock','Loan period',`Up to ${item.maxDays} ${item.maxDays === 1 ? 'day' : 'days'}`) + details('cash','Refundable deposit per unit', item.deposit ? currency(item.deposit) : 'None') : ''}</div>
    ${requestAction}
    </section><section class="panel owner-panel"><h2>Listed by</h2><div class="person-row">${avatar(store, item.owner, 'large')}<div><strong>${escape(person.name)}${mine ? ' (you)' : ''}</strong><span>${hostelName(store, item.owner)}</span></div><div class="owner-score">${ratingMark(store, item.owner)}<small>${reviews.count} ratings</small></div></div>
    ${reviews.ratings.filter(review => review.body).slice(-3).reverse().map(review => `<blockquote>${escape(review.body)}</blockquote>`).join('')}
    </section></div></div>`;
}

export const missing = (type = 'page') => empty('search', `This ${type} is unavailable`, 'Find another listing or head back to the marketplace.', link('Browse listings', 'browse', 'primary'));

export function myListings(store) {
  const items = store.listings.filter(item => item.owner === store.user && !item.deleted);
  return heading('My listings', 'Manage the items you share with your campus.', action('List an item','new-listing',{ glyph: 'plus' })) + (items.length ? grid(items.map(item => listingCard(store, item, true))) : empty('box','You haven’t listed anything yet','Start with an item a student in your hostel might need.',action('List an item','new-listing',{ glyph: 'plus' })));
}

export function wishlist(store) {
  const items = (store.saved[store.user] ?? []).map(id => store.listings.find(item => item.id === id)).filter(item => item && !item.deleted);
  return heading('Wishlist', 'Keep useful finds in one place.') + (items.length ? grid(items.map(item => listingCard(store, item))) : empty('heart','Your wishlist is empty','Tap the heart on any listing to save it for later.',link('Browse listings','browse','primary')));
}

export function tabBar(tabs, active, label) {
  return `<nav class="tabs" aria-label="${label}">${tabs.map(([id, title, href]) => `<a class="tab ${id === active ? 'active' : ''}" href="#${href}" ${id === active ? 'aria-current="page"' : ''}>${title}</a>`).join('')}</nav>`;
}

export function requestsPage(store, tab) {
  const current = tab === 'incoming' ? 'incoming' : 'sent';
  const items = store.requests.filter(request => (current === 'incoming' ? request.owner : request.borrower) === store.user);
  const tabs = tabBar([['sent','Sent','requests/sent'],['incoming','Received','requests/incoming']], current, 'Request views');
  return heading('My requests', 'Follow pickups and returns, and message the other student.') + tabs + (items.length ? `<div class="stack">${items.map(request => {
    const item = store.listings.find(listing => listing.id === request.listing);
    const other = student(store, current === 'incoming' ? request.borrower : request.owner);
    const status = requestStatus(request);
    const conflict = request.bookingConflict;
    return `<a class="request-row panel" href="#request/${request.id}">${photo(item, 'row-image')}<div class="request-row-content"><strong>${escape(item.title)}</strong><span>${current === 'incoming' ? 'From' : 'With'} ${escape(other.name)} · ${unitLabel(units(request))}${request.start ? ` · ${formatDateRange(request.start, request.end)}` : ''}</span>${conflict ? `<span class="request-conflict-text">${escape(clashLabel(store, conflict, current === 'incoming'))}</span>` : ''}</div>${badge(status.name, status.color)}${icon('right', 18)}</a>`;
  }).join('')}</div>` : empty('exchange', current === 'incoming' ? 'No received requests yet' : 'No sent requests yet', current === 'incoming' ? 'List an item to start sharing with your campus.' : 'Find something you need and send a request.', current === 'incoming' ? action('List an item','new-listing') : link('Browse listings','browse','primary')));
}

export function costSummary(request) {
  const { days, fee, deposit, total } = requestTotal(request);
  const quantity = unitLabel(units(request));
  const label = request.mode === 'rent' ? `Rental · ${quantity} × ${days} ${days === 1 ? 'day' : 'days'}` : request.mode === 'sell' ? `Offer · ${quantity}` : `Item cost · ${quantity}`;
  return `<div class="cost-summary"><div><span>${label}</span><strong>${currency(fee || 0)}</strong></div>${deposit ? `<div><span>Refundable deposit · ${quantity}</span><strong>${currency(deposit)}</strong></div>` : ''}<div class="total"><span>Total at pickup</span><strong>${currency(total || 0)}</strong></div></div>`;
}

export function requestPage(store, request) {
  if (!request || ![request.owner, request.borrower].includes(store.user)) return missing('request');
  const item = store.listings.find(listing => listing.id === request.listing);
  const own = request.owner === store.user;
  const other = own ? request.borrower : request.owner;
  const person = student(store, other);
  const expired = requestIsExpired(request);
  const revealRoom = !expired && ['accepted', 'handed', 'return-reported', 'returned'].includes(request.status);
  const status = requestStatus(request);
  const done = request.status === 'returned';
  const stopped = expired || ['declined','cancelled'].includes(request.status);
  const timed = modes[request.mode].timed;
  const timeline = ['requested', 'accepted', 'handed'];
  if (timed) {
    if (!done || request.history.some(entry => entry.status === 'return-reported')) timeline.push('return-reported');
    timeline.push('returned');
  }
  const conflict = request.bookingConflict ?? (!stopped && request.status === 'requested' ? stockConflict(item, request, store.requests) : null);
  const conflictDetails = conflict?.start && conflict.end ? `The conflicting booking covers ${formatDateRange(conflict.start, conflict.end)}.` : `This request was for ${unitLabel(units(request))}.`;
  const clashNotice = conflict ? `<div class="exchange-notice warning">${icon(timed ? 'calendar' : 'box', 20)}<div><strong>${escape(clashLabel(store, conflict, own))}</strong><p>${conflictDetails} ${stopped ? own ? 'The request was declined automatically and the student was notified.' : 'Your request was declined automatically.' : 'This request cannot be accepted with the available stock.'}</p></div></div>` : '';
  let returnNotice = '';
  if (timed && request.status === 'handed') {
    returnNotice = own ? 'The borrower will report the return first.' : 'Report the return after handing the item back.';
  } else if (request.status === 'return-reported') {
    returnNotice = own ? 'Confirm once you have the item back and have checked its condition.' : 'The owner will confirm after checking the item.';
  }
  const requestActionsHtml = requestActions(request, store.user).filter(([next]) => next !== 'accepted' || !conflict).map(([next, label]) => `<button class="button ${['declined','cancelled'].includes(next) ? 'secondary' : 'primary'}" type="button" data-action="move-request" data-id="${request.id}" data-next="${next}">${label}</button>`).join('');
  return `${back(own ? 'requests/incoming' : 'requests/sent','My requests')}${heading(item.title, `${own ? 'Request from' : 'Exchange with'} ${person.name} · ${unitLabel(units(request))}`, badge(status.name, status.color))}
    ${clashNotice}<div class="request-layout"><div class="stack"><section class="panel padded"><h2>Exchange progress</h2><ol class="timeline">${(stopped ? timeline.filter(step => request.history.some(entry => entry.status === step)) : timeline).map(step => {
      const entry = request.history.find(item => item.status === step);
      return `<li class="${entry ? 'reached' : ''}"><span class="step-icon">${entry ? icon('check',15) : ''}</span><div><strong>${requestStatus(request, step).name}</strong>${entry ? `<small>${formatTime(entry.at)}</small>` : ''}</div></li>`;
    }).join('')}${stopped ? `<li class="ended"><span class="step-icon">${icon('x',14)}</span><div><strong>${status.name}</strong><small>${expired ? `Pickup window ended ${formatDay(request.end)}` : formatTime(request.history.at(-1).at)}</small></div></li>` : ''}</ol>
    ${returnNotice ? `<p class="inline-note return-note">${icon('info',17)} ${returnNotice}</p>` : ''}
    ${requestActionsHtml ? `<div class="button-row request-actions">${requestActionsHtml}</div>` : ''}
    ${conflict && !own && item.active && (timed || stockSummary(item, store.requests).free > 0) ? action(timed ? 'Choose other dates or units' : 'Request fewer units', 'request-item', { glyph: timed ? 'calendar' : 'box', data: item.id }) : ''}
    ${expired && !own && item.active ? action('Choose new dates','request-item',{ glyph: 'calendar', data: item.id }) : ''}
    ${done ? request.ratings[store.user] ? `<p class="inline-note">${icon('check',17)} You rated ${escape(person.name)} ${request.ratings[store.user].stars}/5.</p>` : action('Rate this exchange','rate',{ glyph: 'star', data: request.id }) : ''}</section>
    <section class="panel padded" id="conversation"><h2>Conversation</h2><div class="messages">${request.messages.length ? request.messages.map(message => `<div class="message ${message.user === store.user ? 'own-message' : ''}"><div><strong>${message.user === store.user ? 'You' : escape(student(store, message.user).name)}</strong><small>${formatTime(message.at)}</small></div><p>${escape(message.body)}</p></div>`).join('') : '<p class="muted">Use this space to coordinate your exchange.</p>'}</div>
    ${stopped ? '<p class="muted chat-closed">This conversation has closed.</p>' : `<form class="chat-form" data-form="message" data-id="${request.id}"><label class="sr-only" for="message">Message</label><input id="message" name="body" required maxlength="500" placeholder="Write a message…"><button type="submit" class="button primary" aria-label="Send message">${icon('send',18)}<span>Send</span></button></form>`}</section></div>
    <div class="stack"><section class="panel padded"><h2>Pickup details</h2><div class="person-row">${avatar(store, other,'large')}<div><strong>${escape(person.name)}</strong><span>${hostelName(store, other)}</span></div>${ratingMark(store, other)}</div><div class="pickup-details">${details('pin','Meeting spot',escape(request.pickup))}${request.start ? details('calendar','Dates',formatDateRange(request.start, request.end)) : ''}${revealRoom && person.room ? details('hostel','Room',escape(person.room)) : !stopped && !revealRoom ? `<p class="inline-note">${icon('lock',17)} Room details are shared once the request is accepted.</p>` : ''}</div></section><section class="panel padded"><h2>Cost breakdown</h2>${costSummary(request)}</section></div></div>`;
}

export function wantedCard(store, post) {
  const category = categories[post.category];
  const count = post.owner === store.user ? post.offers.length : post.offers.filter(offer => offer.user === store.user).length;
  return `<article class="panel wanted-card"><div class="row-between"><span class="feature-icon ${category.color}">${icon(category.icon,22)}</span>${badge(post.closed ? 'Fulfilled' : category.name, post.closed ? 'green' : category.color)}</div><h3><a href="#wanted/${post.id}">${escape(post.title)}</a></h3><p>${escape(post.description)}</p><div class="wanted-meta">${icon('calendar',16)}Needed by ${formatDay(post.needed)}</div><div class="wanted-footer"><div class="owner-mini">${avatar(store, post.owner,'tiny')}<span>${escape(student(store, post.owner).name)}<small>${hostelName(store, post.owner)}</small></span></div>${link(count ? `${count} ${count === 1 ? 'offer' : 'offers'}` : post.owner === store.user || post.closed ? 'View post' : 'I can help',`wanted/${post.id}`)}</div></article>`;
}

export function wantedBoard(store, tab) {
  const mine = tab === 'mine';
  const posts = store.wanted.filter(post => mine ? post.owner === store.user : !post.closed);
  return heading('Wanted board', 'Ask for something you need or help a student find it.', action('Post a wanted','new-wanted',{ glyph: 'plus' })) + tabBar([['open','Open posts','wanted'],['mine','My posts','wanted/mine']], mine ? 'mine' : 'open', 'Wanted views') + (posts.length ? `<div class="community-grid">${posts.map(post => wantedCard(store, post)).join('')}</div>` : empty('wanted',mine ? 'You have no wanted posts' : 'No open wanted posts','Tell your campus what you’re looking for.',action('Post a wanted','new-wanted')));
}

export function wantedPage(store, post) {
  if (!post) return missing('wanted post');
  const own = post.owner === store.user;
  const offers = post.offers.filter(offer => own || offer.user === store.user);
  return `${back('wanted','Wanted board')}${heading(post.title, `Posted by ${student(store, post.owner).name} · ${hostelName(store, post.owner)}`, badge(post.closed ? 'Fulfilled' : 'Open', post.closed ? 'green' : 'purple'))}<div class="request-layout"><div class="stack"><section class="panel padded"><h2>What they need</h2><p class="preserve-lines">${escape(post.description)}</p><div class="detail-grid">${details(categories[post.category].icon,'Category',categories[post.category].name)}${details('calendar','Needed by',formatDay(post.needed))}</div>${!post.closed ? own ? action('Mark fulfilled','close-wanted',{ data: post.id, style: 'secondary' }) : !offers.length ? action('Offer to help','help-wanted',{ data: post.id, glyph: 'chat' }) : '' : ''}</section>
    <section class="panel padded"><h2>${own ? 'Offers' : 'Your offer'}</h2>${offers.length ? `<div class="stack">${offers.map(offer => `<article class="offer-card"><div class="person-row">${avatar(store, offer.user)}<div><strong>${escape(student(store, offer.user).name)}</strong><span>${formatTime(offer.at)}</span></div>${badge(offer.status === 'accepted' ? 'Accepted' : 'Offered', offer.status === 'accepted' ? 'green' : 'purple')}</div><p class="preserve-lines">${escape(offer.body)}</p>${offer.status === 'accepted' && offer.pickup ? `<p class="inline-note">${icon('pin',17)}${escape(offer.pickup)}</p>` : own && !post.closed ? `<button type="button" class="button secondary" data-action="accept-offer" data-id="${post.id}" data-offer="${offer.id}">Accept offer</button>` : ''}</article>`).join('')}</div>` : `<p class="muted">${own ? 'Offers from other students will appear here.' : 'Have an item that could help? Send a short offer with where you can meet.'}</p>`}</section></div><section class="panel padded align-start"><h2>Posted by</h2><div class="person-row">${avatar(store, post.owner,'large')}<div><strong>${escape(student(store, post.owner).name)}</strong><span>${hostelName(store, post.owner)}</span></div>${ratingMark(store,post.owner)}</div></section></div>`;
}

export function hostelsPage(store, hostel, tab) {
  if (!hostel) {
    const entries = Object.entries(hostels).sort(([a], [b]) => Number(b === student(store, store.user).hostel) - Number(a === student(store, store.user).hostel));
    return heading('Hostels', 'Explore what students are sharing across campus.') + `<div class="community-grid">${entries.map(([key, entry]) => `<article class="panel hostel-card"><div class="row-between"><span class="feature-icon ${entry.color}">${icon('hostel',24)}</span>${key === student(store, store.user).hostel ? badge('Your hostel','purple') : ''}</div><h2>${entry.name}</h2><p>${entry.description}</p><div class="hostel-meta">${icon('users',17)}${Object.values(students(store)).filter(person => person.hostel === key).length} members</div>${link('View hostel',`hostels/${key}`)}</article>`).join('')}</div>`;
  }
  if (!Object.hasOwn(hostels, hostel)) return missing('hostel');
  const info = hostels[hostel];
  const sections = ['listings','members','wanted'];
  const active = sections.includes(tab) ? tab : 'listings';
  const members = Object.keys(students(store)).filter(key => student(store, key).hostel === hostel);
  const items = store.listings.filter(item => item.active && !item.deleted && members.includes(item.owner));
  const posts = store.wanted.filter(post => !post.closed && members.includes(post.owner));
  return `${back('hostels','All hostels')}<div class="hostel-cover ${info.color}"><span class="feature-icon ${info.color}">${icon('hostel',31)}</span><div><h1>${info.name}</h1><p>${members.length} members · ${items.length} active listings</p></div>${hostel === student(store, store.user).hostel ? badge('Your hostel','purple') : ''}</div>
  ${tabBar([['listings',`Listings (${items.length})`,`hostels/${hostel}`],['members',`Members (${members.length})`,`hostels/${hostel}/members`],['wanted',`Wanted (${posts.length})`,`hostels/${hostel}/wanted`]],active,'Hostel views')}
  ${active === 'listings' ? items.length ? grid(items.map(item => listingCard(store,item))) : empty('box','No active listings here','Browse the campus marketplace to see what’s available.',link('Browse listings','browse','primary')) : active === 'members' ? `<div class="community-grid">${members.map(key => `<div class="panel padded person-row">${avatar(store, key,'large')}<div><strong>${escape(student(store, key).name)}${key === store.user ? ' (you)' : ''}</strong><span>${reputation(store,key).count} ratings</span></div>${ratingMark(store,key)}</div>`).join('')}</div>` : posts.length ? `<div class="community-grid">${posts.map(post => wantedCard(store,post)).join('')}</div>` : empty('wanted','No open wanted posts','Post what you need to ask the community for help.',action('Post a wanted','new-wanted'))}`;
}

export function notificationsPage(store) {
  const items = store.notifications.filter(notification => notification.user === store.user);
  return heading('Notifications', 'Keep up with requests, offers, and messages.',items.some(n => !n.read) ? action('Mark all as read','read-all',{ style: 'secondary', glyph: 'check' }) : '') + (items.length ? `<div class="stack">${items.map(note => `<button class="panel notification-row ${note.read ? '' : 'unread'}" type="button" data-action="read-note" data-id="${note.id}"><span class="feature-icon purple">${icon(note.route.startsWith('wanted') ? 'wanted' : 'bell',20)}</span><span class="note-text"><strong>${escape(note.title)}</strong><span>${escape(note.body)}</span><small>${formatTime(note.at)}</small></span>${!note.read ? '<i class="note-dot" aria-label="Unread"></i>' : ''}${icon('right',18)}</button>`).join('')}</div>` : empty('bell','You’re all caught up','Updates about your exchanges will appear here.',link('View requests','requests','primary')));
}

export function profilePage(store) {
  const routes = [...navItems.slice(3), ['notifications','bell','Notifications'], ['hostels','hostel','Hostels']];
  return `${heading('Your space','Manage your campus exchanges.')}<section class="panel padded profile-panel"><div class="person-row">${avatar(store, store.user,'large')}<div><strong>${escape(student(store, store.user).name)}</strong><span>${hostelName(store, store.user)}</span></div>${ratingMark(store,store.user)}</div><div class="button-row">${action('Switch demo student','accounts',{ style:'secondary', glyph:'users' })}${action(store.theme === 'dark' ? 'Light theme' : 'Dark theme','theme',{ style:'secondary', glyph:store.theme === 'dark' ? 'sun' : 'moon' })}</div></section><div class="stack profile-links">${routes.map(([to,glyph,label]) => `<a class="panel profile-link" href="#${to}">${icon(glyph,21)}<strong>${label}</strong>${icon('right',18)}</a>`).join('')}</div>`;
}
