# AGENTS.md — ELITE development instructions

## Read first

Before writing or changing application code, read all project documentation:

1. `docs/01-brief.md` — product scope, brand, architecture, and deployment.
2. `docs/02-screens.md` — screen behavior, responsive expectations, and shared components.
3. `docs/03-flows-rules.md` — queue lifecycle, business rules, edge cases, and acceptance tests.

If implementation reveals a genuine contradiction or an unresolved business decision, stop and ask for clarification or document the proposed decision before coding. Do not silently invent a different product policy.

## Scope and delivery discipline

- Implement one screen or one tightly bounded feature at a time.
- Preserve existing working features and compatibility unless the task explicitly authorizes a change.
- Do not introduce features outside the agreed ELITE scope.
- Treat the documented queue rules as product requirements, not suggestions.
- Keep customer-facing and staff-facing permissions separate and enforce authorization on the server.
- Make small, reviewable changes with clear names and predictable structure.
- Do not replace the Render + API + PostgreSQL architecture without explicit approval.

## Product and design consistency

- Maintain the ELITE identity: deep charcoal, champagne gold, elegant serif headings, clean sans-serif interface text, premium surfaces, restrained borders, refined shadows, and generous spacing.
- Prefer a reusable design system and shared components over one-off screen styling.
- Design customer screens mobile-first, staff screens for tablet/desktop, and the TV screen for large landscape viewing distance.
- Keep English and Gujarati supported through the centralized translation system. Never hardcode user-facing labels in screen components.
- Use Lucide React icons consistently; do not mix arbitrary icon libraries.
- Use Motion for React for interface motion. Use GSAP only for an isolated cinematic sequence where it adds real value.
- Respect reduced-motion preferences and ensure every animated state has a usable non-animated equivalent.
- Animation must never obscure a queue action, delay essential information, or create excessive motion during frequent updates.

## Queue correctness

- The backend/database is the source of truth for queue order, status, timestamps, barber eligibility, duplicate-phone prevention, and estimates.
- Preserve first-come, first-served ordering.
- A specific-barber request is a hard constraint and must never be assigned to another barber.
- A barber can serve only one customer at a time.
- Preserve the documented lifecycle: Waiting → Called → In Chair → Done, with explicit Cancelled and No-show terminal paths.
- Enforce the 10-minute Called-to-No-show cutoff using server time and salon timezone.
- A returning no-show customer gets a new registration and new token at the end.
- Prevent duplicate active registrations using normalized phone numbers.
- Revalidate every mutation transactionally so stale screens cannot overwrite newer queue state.
- Treat live events as synchronization hints; refetch authoritative state after reconnects or conflicts.

## Engineering and security

- Use JavaScript with ES modules for the React frontend and planned Node.js backend. Do not introduce TypeScript without explicit approval.
- Keep secrets and database credentials out of source control.
- Validate and authorize on the backend even when the frontend already validates.
- Avoid exposing phone numbers or sensitive customer data on the public TV screen.
- Use locale-aware date, time, number, and currency formatting.
- Prefer archive/deactivate behavior over deleting records referenced by history.
- Provide loading, empty, error, reconnecting, and permission-denied states.
- Keep accessibility in scope: semantic controls, keyboard access, focus states, contrast, readable labels, and text alternatives for status/progress.

## Verification before completion

- Test the affected screen/feature and the relevant queue rules before declaring the task complete.
- Add or update automated tests for business logic and critical transitions.
- Manually verify responsive behavior for the target environment when the change is visual.
- Verify English and Gujarati for changed interface text.
- Check reduced-motion behavior for changed animations.
- Run the project's available lint, typecheck, build, and focused tests as appropriate.
- Do not claim success when a check was not run; report blockers plainly.

## Handoff format after each task

Every completed task report must include:

1. What was implemented.
2. Changed files.
3. Tests/checks run and their results.
4. Any known limitations, open decisions, or follow-up work.
5. Clear instructions for reproducing or reviewing the change.

## Implementation roadmap

1. Confirm the open business decisions in `docs/01-brief.md` and `docs/03-flows-rules.md`.
2. Initialize the React/Vite frontend and JavaScript backend structure without building product screens yet.
3. Establish the shared design tokens, typography, translation catalog, routing shell, auth boundary, and accessibility baseline.
4. Design the PostgreSQL schema, migrations, seed data, queue status history, and transactional service layer.
5. Build the API and SSE synchronization contract with focused queue-rule tests.
6. Implement Home Page and Join Queue end to end.
7. Implement My Status and customer reconnect/cancellation behavior.
8. Implement Reception Dashboard and walk-in/Call Next/no-show controls.
9. Implement Barber View and break/timer transitions.
10. Implement Waiting Area TV with public-data protection and reconnect behavior.
11. Implement Owner Settings and daily statistics.
12. Perform cross-role, responsive, localization, accessibility, reduced-motion, concurrency, and deployment verification.
13. Deploy staging on Render, validate environment configuration and database migrations, then prepare production release.

