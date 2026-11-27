# CampusShare

CampusShare is a mobile-first marketplace for swapping everyday essentials between hostels. The demo starts with nine fictional student accounts across Maple Hall, Cedar House, and Birch Residency. Listings, requests, offers, reviews, and messages persist in browser storage. The **Switch** control in the header lets reviewers act as both participants. **Add demo student** accepts a fictional `@campus.example` address for this browser's demo. **Reset demo** restores the original examples.

## Run locally

Run `node preview.mjs` from the repository root and open [CampusShare](http://127.0.0.1:4173). The site uses plain HTML, CSS, and JavaScript and needs no dependency installation or build step.

## Try an exchange

1. As Anika Rao, open **Casio Scientific Calculator** and request it. Choose dates, a pickup spot, and a message. The estimate includes the refundable deposit.
2. Switch to **Rohan Mehta** and accept the request, then mark it handed over. The room field appears after acceptance.
3. Switch to **Anika Rao** and select **I’ve returned it**. Switch back to Rohan. After checking the item, select **Confirm return**. Both students can now rate the exchange.

## Try a booking clash

1. On **Browse**, select **See a booking clash**. Anika’s overlapping drawing kit request shows why it was declined and offers a new date range. Booked dates appear in the form alongside the first available range for the same loan length.
2. Switch to **Rohan Mehta** on the same request. His view names Aarav’s booking. Under **My requests → Received**, there are two more overlapping drawing kit requests from Maya and Kabir. Accept either one to decline the other automatically and send that borrower a notification.

## Try a shared stock listing

1. Switch to **Priya Menon** and open **My requests → Received**. Accept Aarav’s request for two extension boards, then Rohan’s request for three on the same dates. Maya’s request automatically declines, and the listing shows five units reserved.
2. Mark Aarav’s handover and check the listing again. Only two units are on loan. Mark Rohan’s handover and the listing becomes **On loan**. A reported return releases stock after Priya confirms the units are back.
3. As Priya, create another listing called **Extension Boards**. The app asks whether to add the units to her existing listing or post separately. An identical title from another student creates a separate listing.

Rent and sale offers are per unit. Date reservations count both pickup and return day. New loan dates must be within the next 90 days, including day 90. A request expires when its pickup window passes without a handover. Stock already handed over stays reserved until the owner confirms its return. For loans, the upcoming pickup count is the highest number of units promised on any one day. Sale and giveaway stock decreases when units are handed over.

The demo uses fictional identities and client-side room visibility. Its data is scoped to the browser profile where you use it.

## Test after a change

Use Node.js 24. Install the test dependencies and Chromium once, then run `npm test` after each change.

```sh
npm ci
npm exec -- playwright install chromium
npm test
```

`npm test` runs the booking and inventory rule tests, followed by the real browser suite. The browser suite starts and stops its own local preview on port 4174. Set `CAMPUSSHARE_TEST_PORT` if that port is occupied. To use installed Microsoft Edge, set `CAMPUSSHARE_TEST_CHANNEL` to `msedge` before running the suite.

The GitHub Actions workflow runs both suites on pushes and pull requests. It uploads the browser report and traces on failures. Each browser test starts in a fresh context, fixes the clock before the demo loads, and lets the application seed its own data. Tests that open a second tab deliberately share that test's browser storage. The browser suite exercises the app's local font fallbacks so it can run without the external font service.

| Feature | What the checks prove | What must be refused or recoverable |
| --- | --- | --- |
| Pages and access | Main pages and deep links load with the right content. | Unrelated students cannot see private requests, rooms, or conversations. Missing routes lead back to Browse. |
| Demo accounts | Switching changes the active student, and refresh preserves the selection. Confirmed reset restores the seed. | Escape and cancelling reset preserve the current data. |
| Listings | Search, combined filters, photo upload, and same-owner merge or separate posting work. Matching titles from different owners stay separate. | Empty search results recover, and blank names or invalid prices cannot be published. |
| Quantities and costs | Changing unit count updates rent and the deposit. | Zero, fractional, blank, or excessive quantities cannot be submitted. |
| Dates and clashes | The app shows booked dates and suggests the same loan length at the next available dates. | Past dates, reversed ranges, long loans, and booked dates are blocked. |
| Selling and giving away | Per-unit offers and single handovers update stock. The final unit changes the listing to Sold or Given away. | Invalid offers, extra pickups, and return actions for permanent handovers are refused. |
| Borrowing journey | A student requests, messages, and reports a return. The owner accepts, hands over, and confirms. Both can then rate. | Room details and wrong-role actions stay hidden, and cancellation or decline closes the conversation. |
| Stale or wrong actions | Two tabs see availability changes and can act on current data. | Overlapping single-unit acceptances, duplicate open requests, and repeat ratings cannot both succeed. |
| Editing listings | Changes persist, and owners can pause, resume, or delete eligible listings with confirmation. | Stale edits, stock reductions below commitments, share-type changes with open requests, and deletion of loaned stock are refused. |
| Wanted board | Students post, offer help, accept an offer, and receive notifications. | Past dates, self-offers, duplicate offers, and other visitors’ access to private offers are blocked. |
| Profiles and wishlist | The profile follows the current student. Theme and wishlist changes survive refresh. | Wishlists are scoped per student, and students cannot save their own listings. |
| Navigation | Active tabs, browser Back and Forward, and keyboard focus follow the current page. | Unknown destinations show a recovery link. |
| Phone layout | Touch navigation and dialogs fit at 320 and 390 px. | Horizontal overflow, desktop-only navigation, and invalid mobile submissions fail the checks. |
| Multi-unit requests | Concurrent requests for two and three can share five units. Confirmed returns release only the returned stock. | Requests exceeding remaining stock are refused or automatically declined and notified. |

### Diagnose a failure

1. Read the first failing assertion and the captured browser errors. Uncaught exceptions, console errors, and failing CampusShare HTTP responses fail the test. Expected validation messages are asserted separately.
2. Rerun the feature with `npm run test:e2e -- --grep "Dates and clashes"`. Open the report with `npm exec -- playwright show-report` to inspect the trace, screenshot, and interaction before the failure.
3. Reproduce the same steps with the seeded accounts. Fix the app when the observed behavior violates the requirement. Correct the test when its selector, setup, or expectation is wrong. Keep the original behavior assertion and rerun `npm test`.

Playwright runs without automatic retries so an intermittent failure remains visible. [Playwright CI documentation](https://playwright.dev/docs/ci)

## Corner-case audit

The first targeted run in Microsoft Edge reproduced seven defects across 16 browser checks. The final `npm test` run included 18 audit browser checks, the prior 32 browser checks, and 16 rule tests. Every check passed. The browser harness reported zero uncaught exceptions, console errors, or failed CampusShare HTTP responses. The audit uses the seeded demo with a fixed clock and advances it for expired and overdue cases.

### Test groups

| Test group | Checks | Passed | Failed |
| --- | ---: | ---: | ---: |
| Shared stock, per-unit costs, sales and giveaways | 8 | 8 | 0 |
| Listings, duplicates, editing and title input | 9 | 9 | 0 |
| Dates, expiry, clashes and stale or wrong actions | 14 | 14 | 0 |
| Borrowing journey and ratings | 3 | 3 | 0 |
| Demo accounts and campus email | 3 | 3 | 0 |
| Pages, access, profiles, wishlist and navigation | 8 | 8 | 0 |
| Wanted board | 2 | 2 | 0 |
| Phone layout, feedback and dark mode | 3 | 3 | 0 |
| **Browser subtotal** | **50** | **50** | **0** |
| Rule tests | 16 | 16 | 0 |
| **Total** | **66** | **66** | **0** |

### Expected and observed behavior

| Case exercised in the running app | Expected | Observed on the final run |
| --- | --- | --- |
| Rohan lists two exam calculators | Maya and Aarav can share the same dates. Anika can book a later range. | Both overlapping loans were accepted. Anika's overlapping form was disabled. She used the suggested range and Rohan accepted it. |
| Priya lends five extension boards | Accepting Aarav's two declines Anika's four. Accepting Rohan's three then declines Maya's one. | Each decline happened at its own stock threshold and generated a notification. Six units were blocked. All five were accepted on a free day. |
| Two rental units for two days | At ₹20 per unit per day and ₹100 deposit per unit, the estimate is ₹80 rent plus ₹200 deposit. | The form showed ₹280 total, and recalculated for three units. |
| Anika sells five chairs | Priya's two and Maya's three sell all five. Kabir's one is declined and he is notified. | The listing stayed For sale after the first handover and became Sold after the second. Kabir's notification opened his declined request. |
| Partial and complete physical handover | Two of five handed over leaves three free now. All five out shows On loan. | Both counts matched. Lowering stock below custody was refused, and a reported return released units after confirmation. |
| Same owner repeats Rice cooker | Anika can merge the unit or choose a separate listing. | Merge increased the original to two units. Post separately created an independent one-unit listing. |
| Two owners list the same calculator model | Search lists both owners, and the borrower can request either independently. | Maya saw both Anika and Rohan in search and submitted two distinct requests. |
| One cycle with overlapping dates | Maya can accept only one request. The rejected request names the existing borrower to the owner. | Accepting Anika caused Rohan's decline with “Clashes with Anika’s booking.” |
| Invalid loan dates and duration | Past pickup, reversed range and a loan beyond the owner's maximum are barred. | Each failure disabled Send. A corrected range could be submitted. |
| Dates far ahead | Day 91 is barred. The inclusive booking window allows day 90. | Anika saw the booking-window warning, then submitted for day 90. The rule tests also checked a return after the window. |
| Old pending or accepted pickup | An overdue pickup that never occurred expires, loses pickup actions and private room details, and allows a new request. | Rohan's stale Accept was refused. Zoya's accepted pickup expired without a handover. Anika could book fresh dates. |
| Actual overdue loan | Units remain out after their due date until the owner confirms the return. | Priya's two overdue boards still left only three available for future dates. All five became available after confirmation. |
| Stale Accept after a decline | A decline committed first cannot be reversed by the other tab's Accept. | Both tabs remained Declined. The stale tab reported that the request had changed. |
| Double-click Accept | One transition and notification, with success feedback. | The timeline and borrower's notifications each showed one acceptance. The owner saw the success message. |
| Wrong role or repeat open request | A borrower has no owner controls. Another student cannot pause the listing. A second open request must be refused. | Owner controls were absent for the borrower. The pause rule rejected the wrong student. A duplicate submitted from two tabs produced one request. |
| Listing changes during an open request | Protect share type, quantity, deletion and the duration already requested. | Deleting loaned stock, switching modes and reducing committed stock were blocked. Rohan's two-day edit was refused while a four-day request was open. |
| Names and campus email | Blank names, malformed addresses, outside domains and repeated addresses are refused. | The form rejected them and persisted Isha's valid demo account. Isha could request a calculator, and Rohan could accept it. |
| Prices and offers | Zero, negative and excessive amounts are refused. | Native input validation kept both invalid listing prices and invalid offers from submitting. |
| Ratings | A fourth-star click saves four. Another submission of the same student's rating is refused. | Four stars survived refresh. A stale tab's second rating was rejected and the original stayed visible. |
| Markup-like title | Render the entered title literally wherever it is shown. | The title was visible verbatim in details and search. It was rendered as text. |
| Phone and dark theme | Fit the 320 and 390 px viewports, keep the action clear of feedback, and use readable text colors. | Pages and dialogs fit without sideways scrolling. The feedback and Send button had separate bounds, and a tap sent the message. The dark Send button met the 4.5:1 contrast target. [W3C text contrast reference](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Unrecognized hostel route | Show the unavailable page with a way to return to Browse. | The invalid hostel key showed the recovery link and it opened Browse. |

### Defects found and fixed

| Defect | How it was reproduced | Fix verified by the regression check |
| --- | --- | --- |
| No advance booking limit | Anika entered day 91 and the request form said a unit was available. | One 90-day rule now governs date controls, availability suggestions and request submission. |
| Expired pickups still looked open | Advancing the clock and clicking Accept correctly refused the change, but the badge stayed Requested. | Pending and uncollected accepted pickups now display Expired and release their holds. Expired actions and private room details are removed, and the borrower can start a new request. |
| Double-click replaced success with an error | Anika double-clicked Accept while the database write was queued. A success was followed by a stale-action error. | The transition button disables immediately while its write is pending. The transaction still checks the current state for requests from other tabs. |
| A duration edit could break an open loan | Rohan saved a two-day maximum after Anika requested four days. | A listing edit checks open loan durations in the same transaction before saving. |
| Campus-email checks had no enrollment flow | The student switcher had no way to enter or validate an email. | Added browser-local demo enrollment with required names, a fictional campus domain, and case-insensitive uniqueness across demo students. |
| An inherited object key rendered as a hostel | Opening the unrecognized `hostels/constructor` route bypassed the missing-hostel view. | The router now accepts only keys declared in the hostel directory. |
| Feedback covered a phone action | At 320 px, the feedback popup visually overlapped Send in a scrolled conversation. | Feedback now occupies its own row below the header controls. The phone test checks the visual bounds and taps Send while feedback is visible. |
