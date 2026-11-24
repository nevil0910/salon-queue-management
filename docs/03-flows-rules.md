# ELITE flows, queue rules, and test checklist

## Canonical queue lifecycle

The normal lifecycle is:

`Waiting → Called → In Chair → Done`

Allowed terminal alternatives are:

- `Waiting → Cancelled` when the customer cancels or staff cancels with a reason.
- `Called → No-show` only after the 10-minute grace period and a staff action.

`No-show` and `Cancelled` registrations cannot be reactivated. A returning no-show customer must create a new registration and receive a new token at the end of the queue. Historical status records remain auditable.

## Queue ordering and assignment rules

1. Queue order is first come, first served using the server-created registration timestamp plus a monotonic tie-breaker/token sequence for the operating day.
2. A customer may select a particular barber or `Any Barber`.
3. A specific-barber request is a hard constraint. It must never be assigned, called, or moved to another barber.
4. `Any Barber` may be assigned to any eligible available barber according to the salon's assignment policy. The initial default is the first eligible available barber, with stable deterministic tie-breaking.
5. A barber can serve only one customer at a time.
6. A barber on break, inactive, or unavailable is not eligible for a new assignment.
7. Call Next must select the earliest waiting entry whose barber preference can currently be satisfied. If an earlier entry is blocked by its requested barber, it remains in place; later entries may be selected only when the product explicitly indicates that the earlier entry is not currently eligible. The implementation must not silently violate the requested barber constraint.
8. Queue positions shown to customers are derived from active entries ahead of them under the current eligibility/order policy and may change when entries are cancelled, called, or assigned.
9. Estimated wait is an estimate, not a promise. It must be recalculated from active queue state, service durations, barber availability, breaks, and configured operating assumptions.
10. Token numbers are unique within an operating day and are never reused that day, including after cancellation or no-show.

## Registration rules

- Online Join Queue is available only while the salon is open and before the configured cutoff ahead of closing. The default cutoff is 30 minutes; the owner may adjust it in settings.
- Walk-in registration remains available to reception while the salon can operationally accept customers, even after online joining closes.
- A registration requires customer name, normalized phone number, at least one active service, and a barber preference.
- Duplicate active registration is blocked when the same normalized phone number already has a non-terminal entry for the same salon/day. The error must point the customer/receptionist to the existing status where safe.
- A completed, cancelled, or no-show entry does not block a future registration, subject to any future business policy.
- Service prices and durations are snapshotted onto the queue entry at registration so later service edits do not rewrite historical estimates or totals.
- A specific barber becoming unavailable during form completion must cause a visible revalidation error. Never silently switch the customer to Any Barber.
- Race conditions are resolved by the server transaction and database constraints, not by client-side checks alone.

## Transition rules

### Waiting → Called

Only reception or an authorized operational action can call an entry. The selected entry must still be Waiting, its barber constraint must be satisfiable, and the target barber must not be serving someone else or on break. Record called time, actor, assigned barber, and status history.

### Called → In Chair

The assigned barber or authorized reception action starts the service. Revalidate that the entry is still Called and the barber is still free. Record start time. A called customer cannot be moved to another barber to resolve a conflict.

### In Chair → Done

The assigned barber or authorized reception action completes service. Record completion time, actual duration, and actor. The barber becomes eligible for the next assignment unless on break/offline.

### Called → No-show

Reception can mark No-show only when at least 10 minutes have elapsed since `calledAt`, using server time and salon timezone. The UI should show the remaining grace time before the action becomes enabled. Record reason/actor/time. The customer sees a terminal no-show state and instructions to rejoin.

### Waiting → Cancelled

Customers can cancel only while Waiting. Reception/owner may cancel according to permission and must provide a reason or select a standardized reason. A Called or In Chair customer cannot self-cancel through My Status.

## Barber breaks

- A barber may start a break only when not In Chair, unless an owner policy explicitly allows an emergency break workflow.
- Starting a break blocks new assignments and is visible to reception and estimates.
- An already Called assignment remains assigned to that barber; the system must not move it automatically. Reception must resolve it through an explicit, policy-compliant action.
- Ending a break makes the barber eligible again, subject to active/inactive state and current assignments.
- Break start/end is timestamped for statistics and audit.
- If a barber goes unavailable while serving, the current customer remains In Chair; the operational resolution must be explicit rather than silently reassigning.

## Synchronization and stale-client rules

1. The backend is authoritative for status, order, eligibility, time cutoffs, and estimates.
2. Every mutation includes an authorization check and revalidates the current row/version in a transaction.
3. A stale action returns a conflict response with current state; the client refreshes and explains what changed.
4. SSE events are hints to refetch, not a replacement for server validation.
5. On reconnect, each screen performs a full refetch for its scope before resuming normal interaction.
6. The TV never displays cached private information and should fail to a safe public reconnecting state.

## Customer flow

1. Customer opens Home Page and sees salon/open status.
2. Customer selects Join Queue.
3. Customer enters details, services, and barber preference.
4. Client calculates a preview; server validates and creates the entry transactionally.
5. Customer sees the generated token and enters My Status.
6. Status updates arrive through SSE/polling fallback.
7. Customer may cancel while Waiting.
8. When Called, customer receives a prominent turn message and arrival guidance.
9. Staff moves the entry through In Chair and Done, or marks No-show after 10 minutes.

## Reception flow

1. Reception opens the protected dashboard and verifies the operating day.
2. Reception registers walk-ins or monitors online entries.
3. Reception reviews the ordered waiting list and barber availability.
4. Reception invokes Call Next; the server chooses or validates an eligible assignment.
5. Reception handles arrival, no-show cutoff, cancellations, and operational exceptions.
6. Reception observes live updates from barber and customer screens.

## Barber flow

1. Barber signs in and sees availability/current assignment.
2. Barber is assigned a Called entry under the hard barber constraint.
3. Barber starts service, which moves the entry to In Chair and starts the timer.
4. Barber completes service, which moves the entry to Done and refreshes the queue.
5. Barber starts/ends breaks only through the explicit availability control.

## TV flow

1. TV loads a public salon/day display context.
2. It subscribes to public queue events only.
3. It shows current serving data and the next five public tokens.
4. It animates meaningful changes and refetches on reconnect.

## Owner flow

1. Owner opens protected settings.
2. Owner edits services, barbers, hours, queue controls, or language/display preferences.
3. The system distinguishes immediate changes from next-day changes.
4. Owner reviews daily statistics generated from immutable queue events/status history.

## Edge cases to design and test

- Two customers submit the same phone number at nearly the same time.
- A selected specific barber becomes unavailable between form load and submission.
- Two receptionists click Call Next simultaneously.
- A barber starts service from a stale screen after reception changed the assignment.
- A customer cancels while reception is opening the entry.
- A customer is Called exactly around the 10-minute cutoff.
- No barbers are eligible for a specific-barber request.
- All barbers are on break or serving, producing an honest wait estimate.
- The salon closes while online joining is open on a stale browser tab.
- The browser refreshes during token creation or after a network timeout.
- SSE disconnects while a queue change occurs, then reconnects.
- A service or barber is archived while historical entries reference it.
- The active operating day changes at midnight/timezone boundary.
- A price/duration changes after registration.
- A TV must not leak a customer's phone or full private name.
- Reduced motion is enabled or the device is low-power.
- Gujarati text is longer than English and causes layout overflow.

## Minimum acceptance test checklist

| ID | Scenario | Expected result |
| --- | --- | --- |
| T01 | Customer joins with valid details and Any Barber | One Waiting entry and unique token are created; confirmation shows position and estimate. |
| T02 | Customer joins with a specific barber | Entry records the hard barber preference and can only be assigned to that barber. |
| T03 | Same phone submits a second active registration | Server blocks the duplicate and does not create a second active token. |
| T04 | Reception calls next with mixed barber preferences | Earliest eligible entry is called and no specific-barber constraint is violated. |
| T05 | Two staff clients call next simultaneously | Only one valid transition occurs per entry/barber; the other client receives a conflict/refetch result. |
| T06 | Barber starts and completes service | Status changes Called → In Chair → Done; timer and barber availability update for all subscribed screens. |
| T07 | Customer cancels while Waiting | Entry becomes Cancelled, leaves active position calculations, and cannot be called. |
| T08 | Reception attempts no-show before 10 minutes | Action remains disabled/rejected using server time. |
| T09 | Reception marks no-show after 10 minutes | Entry becomes No-show; returning customer must receive a new end-of-queue token. |
| T10 | Online join at/after the configured closing cutoff (30 minutes by default) | Online registration is rejected with the correct message; walk-in workflow remains available if the salon is open and walk-ins are not paused. |
| T11 | Barber starts a break while free | Barber becomes unavailable for assignment; reception and estimates update. |
| T12 | SSE disconnects and reconnects | Screen shows reconnecting state, refetches authoritative data, and does not lose queue changes. |
| T13 | TV receives a queue update | Now Serving/next five update, with no private customer information exposed. |
| T14 | Gujarati selected on mobile and dashboard | All visible labels come from translations and remain usable without clipping/overflow. |
| T15 | Reduced motion enabled | Nonessential animations are reduced/removed while status changes and alerts remain clear. |
| T16 | Owner archives a service used historically | Service is unavailable for new registrations but historical queue records remain readable. |

## Open decisions before implementation

- Authentication and customer status-link design.
- Exact salon timezone, weekly hours, holidays, and closure override policy.
- INR/currency and tax display policy.
- External notification channels beyond in-app/live browser updates.
- Exact policy when a called customer arrives before the no-show cutoff.
- Whether staff can manually select a later eligible customer instead of Call Next and under what audit rules.

