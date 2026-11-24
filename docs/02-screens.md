# ELITE screen specification

This document defines the seven required screens and the shared states they must support. Route names are provisional and may be refined during implementation without changing the product behavior.

## Shared screen principles

- Every screen has loading, empty, error, and reconnecting states appropriate to its role.
- Every mutation gives immediate visual acknowledgement and a durable server result.
- Destructive or irreversible actions require confirmation when the risk is meaningful.
- Buttons state their availability and reason when disabled.
- Text is sourced from the English/Gujarati translation catalog.
- Motion follows the global motion policy: purposeful, short, interruptible, and disabled/reduced when the user requests reduced motion.

## 1. Home Page — customer-facing

**Purpose:** Explain the salon and make joining the queue feel easy and trustworthy.

**Primary content:**

- ELITE brand mark, tagline, language switcher, and accessible navigation.
- Salon introduction, address/contact summary, and a premium visual hero.
- Opening status: Open, Closing Soon, Closed, or Opening Soon, with today's hours.
- Live count of waiting customers and a concise estimated wait message.
- Barber availability summary: available, serving, on break, or unavailable.
- Primary “Join Queue” action; it is disabled with an explanatory message when online joining is closed.
- Secondary action to view an existing queue status if the customer has a valid active status context.
- Trust/support content such as service quality statement and contact route, without distracting from the queue action.

**States:** closed salon, online joining closed while walk-ins remain possible, no waiting customers, live data reconnecting, and service unavailable.

**Responsive behavior:** mobile-first single-column hero and status card; larger layouts can use a split hero with operational summary. Keep Join Queue reachable without scrolling excessively.

**Motion:** cinematic logo reveal only on the first visit/session when appropriate; subtle hero lighting; staggered status cards; no looping motion that harms readability.

## 2. Join Queue — customer-facing

**Purpose:** Collect enough information to create a valid queue registration and show the expected price/time before confirmation.

**Form sections:**

1. Customer name and normalized phone number.
2. Service selection, with service name, duration, price, and optional short description.
3. Barber selection: a specific available barber or “Any Barber”.
4. Live summary: selected services, total price, estimated service duration, eligibility notes, and queue estimate.
5. Consent/notice explaining that the registration is a queue position, not a guaranteed appointment time.

**Validation:** required fields, valid phone format, at least one service, active service availability, barber eligibility, online joining cutoff, and duplicate active phone detection. Server validation is authoritative.

**Confirmation:** show a token reveal animation only after the server confirms creation. Display token, initial position, estimated wait, selected barber preference, selected services, and a safe way to return to My Status. Do not reveal other customer data.

**Error handling:** if the queue changes during submission, explain the updated estimate and preserve user input where safe. If the selected barber becomes unavailable, require a new barber choice; do not silently convert a specific request to Any Barber.

**Motion:** animated service cards, smooth price/count updates, calm form progression, and token reveal. Do not animate every keystroke or shift the form layout unexpectedly.

## 3. My Status — customer-facing

**Purpose:** Give one customer a reliable, understandable live view of their registration.

**Primary content:**

- Token number and status badge: Waiting, Called, In Chair, Done, Cancelled, or No-show.
- Current queue position when meaningful.
- Estimated waiting time and circular progress indicator with a text equivalent.
- Selected services and barber preference/assignment.
- Salon open/closing context.
- Turn notification area, including a prominent “YOUR TURN” treatment when Called.
- Cancel action while Waiting, with confirmation and clear outcome.
- Reconnect timestamp/status and last updated indicator.

**Status behavior:** position and estimate refresh from server updates. When Called, the customer sees arrival guidance and the no-show policy. Once In Chair or Done, cancellation is unavailable. Cancelled and No-show are terminal for that registration.

**Motion:** gentle position-change transition, progress updates that remain readable, and a premium but accessible YOUR TURN animation. The notification must also be communicated textually and must not depend on sound or motion.

## 4. Reception Dashboard — staff-facing

**Purpose:** Provide safe, fast control of the live queue.

**Layout:** desktop/tablet operational shell with salon/day selector if applicable, header status, navigation, and a responsive main workspace.

**Primary panels:**

- Queue summary: waiting, called, in chair, completed, no-show, and cancelled counts.
- Waiting list ordered by the server's queue order, showing token, customer display name, requested services, barber preference, wait estimate, and timestamps.
- Barber availability board: available, serving, break, offline.
- Walk-in registration panel using the same validation and service/barber rules as Join Queue.
- Current service/assignment panel.

**Actions:** Call Next, call a selected eligible entry when policy allows, seat/start service, mark No-show after the 10-minute cutoff, cancel with a reason, and inspect an audit/detail drawer. Call Next must respect specific barber requests and only assign an eligible available barber.

**Safeguards:** show why an entry cannot be called; require confirmation for no-show/cancel; prevent stale actions with server version/timestamp validation; show conflicts as recoverable errors rather than overwriting newer state.

**Motion:** stagger dashboard cards on entry, animate summary counters on meaningful changes, and use restrained row transitions. Do not cause the whole table to reflow dramatically when one customer changes state.

## 5. Barber View — staff-facing

**Purpose:** Keep a barber focused on the customer currently in the chair and their own availability.

**Primary content:**

- Barber identity and current availability/break status.
- Current customer token and privacy-safe display name.
- Selected services, service duration, and price summary if permitted.
- Service timer with start time and elapsed/remaining estimate.
- Start Service and Done actions, with disabled reasons when invalid.
- Break controls: Start Break, End Break, and current break state.
- Next eligible customer preview without exposing unrelated private data.

**Rules in the UI:** a barber cannot start another customer while one is In Chair; a barber on break cannot receive a new assignment; a specific-barber request cannot be moved to another barber.

**Motion:** clear transition from Called to In Chair, timer start treatment, Done completion feedback, and subtle availability changes. Avoid noisy continuous animation around the timer.

## 6. Waiting Area TV — public display

**Purpose:** Help waiting customers know who is being served and which tokens are next.

**Display content:**

- ELITE logo and current time/open status.
- “Now Serving” area with active token(s) and barber name/display label.
- Next five tokens in queue, ordered by current eligible queue order.
- Short “please listen for your token” guidance.
- Optional salon branding/ambient visual treatment that never competes with token legibility.

**Privacy and resilience:** no phone numbers, full names, or sensitive service details. High contrast, oversized numerals, and safe margins for large screens. The display must show a reconnecting/fallback state if live updates fail and recover automatically.

**Motion:** soft token changes, a short attention cue when Now Serving changes, and subtle lighting. No rapid ticker, flashing, or perpetual animation that can distract or create accessibility concerns.

## 7. Owner Settings — staff-facing

**Purpose:** Let the owner configure operational data and understand the day without becoming a general-purpose admin console.

**Sections:**

- Salon profile and operating hours, including closing time and online-join cutoff.
- Service management: create/edit/archive service, price, duration, display order, and active state.
- Barber management: create/edit/deactivate barber, supported services if applicable, display name, and availability defaults.
- Queue controls: open/close online joining, pause intake with reason, reset/start an operating day under a safe policy, and review queue status history.
- Daily statistics: registrations, completed services, average wait, average service duration, no-shows, cancellations, barber utilization, and peak periods.
- Language and display preferences where operationally appropriate.

**Safety:** archive rather than delete records referenced by historical queue entries. Clearly distinguish settings that affect today immediately from settings that apply next operating day. Require confirmation for reset/close actions and record actor/time.

**Motion:** animated charts entering view, smooth tab/section transitions, and counters that update without distracting from editing.

## Navigation and route plan

The final route structure should keep customer and staff areas distinct and protect staff routes server-side. A possible plan is `/`, `/join`, `/status/:tokenOrSession`, `/reception`, `/barber`, `/tv`, and `/settings`. The exact route names are not a product requirement; the permission model and screen behavior are.

## Shared component families to design before screen implementation

Brand shell, language switcher, status badge, token display, service card, barber availability chip, queue row, confirmation dialog, toast/alert, empty state, reconnecting banner, loading skeleton, statistic card, progress ring, timer, responsive data table, and TV display primitives.

