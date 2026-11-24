# ELITE — Salon & Grooming

## Project brief

ELITE is a premium salon queue management system for a modern grooming business. It coordinates customers, receptionists, barbers, the waiting-area display, and the owner through one shared queue. The product must feel like a commercially developed luxury SaaS product rather than an academic CRUD application.

**Brand:** ELITE  
**Full name:** ELITE — Salon & Grooming  
**Tagline:** Precision. Style. Experience.  
**Languages:** English and Gujarati  
**Deployment target:** Render

The initial release is a queue-first operational product. Booking calendars, payments, loyalty, inventory, payroll, multi-branch tenancy, and marketing automation are outside the agreed scope unless explicitly approved later.

## Product goals

1. Let a customer join the salon queue quickly from a phone.
2. Give customers trustworthy, live queue position and waiting-time information.
3. Let reception staff register walk-ins and control the queue safely.
4. Give each barber a focused view of the customer currently in their chair.
5. Give the waiting area a clear, high-contrast public display.
6. Give the owner enough service, barber, queue, and daily-statistics controls to operate the salon.
7. Keep all roles synchronized from one persistent source of truth.
8. Establish a polished, accessible design system that can scale screen by screen.

## Users and permissions

### Customer

Customers can browse salon information, see opening status and approximate queue activity, join the queue, view their own active status, cancel while waiting, and receive turn-related notifications. Customers must not see another customer's personal data.

### Receptionist

Receptionists can register walk-ins, see and filter the waiting list, call the next eligible customer, mark no-shows, cancel registrations when appropriate, and inspect current barber availability. Receptionists can see operational customer details needed to manage the queue.

### Barber

Barbers can see their current assignment, selected services, start and complete service, and change their availability/break status. A barber must not be able to work on two active customers simultaneously.

### Owner

Owners can manage services and barbers, configure queue and salon settings, control availability, and view daily operational statistics. Owner settings are operational configuration, not a general administration suite.

### Waiting-area display

The TV display is a public read-only view. It shows serving information and tokens without exposing phone numbers or sensitive customer details.

## Brand and visual direction

The visual language is luxury, cinematic, elegant, and minimal.

- Use a deep charcoal/near-black base with layered charcoal surfaces.
- Use champagne gold as the principal accent for focus, active states, highlights, and key calls to action.
- Pair elegant serif typography for brand and high-impact headings with a clean modern sans-serif for body text, controls, tables, and numeric data.
- Use premium cards, subtle glass effects, refined one-pixel borders, sophisticated shadows, generous spacing, and restrained gradients.
- Prefer deliberate composition and clear hierarchy over decoration.
- Maintain readable contrast, visible keyboard focus, touch-friendly targets, and reduced-motion behavior.

The provisional design tokens must be centralized rather than scattered through components. Exact color values, typefaces, spacing scale, radii, shadows, and motion durations should be finalized during the design-system phase while preserving this direction.

## Responsive product surfaces

| Surface | Primary environment | Key design priority |
| --- | --- | --- |
| Customer screens | Mobile-first phone, then tablet | Fast completion, clarity, reassurance |
| Reception and owner | Tablet/desktop | Dense but calm operational control |
| Barber view | Tablet/desktop or mounted device | Glanceable current work and one-tap actions |
| Waiting Area TV | Large landscape screen | Legibility at distance and low cognitive load |

All interface labels must come from a centralized translation system with English and Gujarati dictionaries. No user-facing label should be hardcoded inside a screen component. Dates, times, numbers, and currency must use locale-aware formatting.

## Technology and architecture decision

### Selected stack

- React with JavaScript (ES modules)
- Vite for the frontend build
- Tailwind CSS for utility styling and responsive composition
- Motion for React for interface motion and transitions
- GSAP only for genuinely cinematic, isolated sequences such as the intro/logo reveal
- Lucide React for consistent icons
- A client-side router such as React Router for route-level screens and protected role areas
- A Node.js backend written in JavaScript (ES modules), exposed as a Render Web Service
- PostgreSQL on Render as the durable shared database

### Why PostgreSQL plus an API

The queue is shared by multiple screens and must remain correct when several people act at nearly the same time. Browser-only state, localStorage, or a static JSON file would create conflicting queues, disappear on refresh, and cannot safely enforce duplicate-phone or barber-assignment rules. PostgreSQL provides durable relational state, transactions, constraints, and audit-friendly status history. A backend is responsible for authorization, queue transitions, validation, transactions, and broadcasting updates.

### Synchronization model

The backend is the source of truth. Screens read through authenticated API endpoints. After a successful mutation, the backend commits the transaction and publishes a queue update. Customer, reception, barber, and TV clients subscribe through Server-Sent Events (SSE) scoped to the salon/day, with short polling fallback if an SSE connection drops. Clients must invalidate/refetch affected data after receiving an event; they must never invent queue order locally.

SSE is chosen as the simplest reliable one-way live-update mechanism for this product. A later version may use WebSockets only if real two-way interaction becomes necessary.

### Render deployment plan

1. Build the React/Vite frontend and deploy it as a Render Static Site.
2. Deploy the API and SSE service as a Render Web Service.
3. Use Render PostgreSQL for production persistence.
4. Store the database URL, session/auth secrets, and allowed frontend origin as Render environment variables/secrets.
5. Configure the frontend API base URL at build/deploy time.
6. Add health checks, structured logs, migration execution, and a production database backup/restore procedure before launch.
7. Use Render preview or a separate staging service/database for test deployment; never test destructive migrations against production.

The first implementation should use one salon and one operating day model, while keeping salon identifiers in the data model so multi-branch support is not accidentally hardcoded into the UI.

## Data concepts to plan before coding

The implementation should model at least: Salon, OperatingDay, Service, Barber, User/Role, QueueEntry, QueueEntryService, QueueEvent/StatusHistory, BarberAvailability/Break, and NotificationPreference/Delivery. Use immutable queue tokens per operating day and a server-generated ordering key. Store phone numbers in a normalized form for duplicate detection. Store timestamps with timezone awareness and apply the salon's configured timezone for business rules and display.

Queue mutations must be transactional. A database constraint or transaction-level check must prevent more than one active queue entry for the same normalized phone number in the same salon. A barber assignment must be revalidated at call/start time so stale screens cannot create double-booking.

## Non-functional requirements

- Accessible keyboard navigation and visible focus states for staff screens.
- WCAG-conscious contrast and legible TV typography.
- Reduced-motion support using the user preference media query and an application setting where appropriate.
- Mobile performance suitable for a normal cellular connection.
- No personal phone numbers on the public TV display.
- Clear loading, empty, error, offline/reconnecting, and permission-denied states.
- Auditability for queue actions and settings changes.
- Graceful recovery after refresh or a dropped connection.
- Safe handling of authentication and role authorization on the server, not only in the client.

## Success criteria for the first release

The release is ready for implementation sign-off when all seven screens are covered by the screen specification, queue transitions are covered by the rules and checklist, role permissions are explicit, the API/database boundary is clear, English/Gujarati text has one translation path, and the deployment plan can be followed without choosing a different hosting platform.

## Explicit assumptions requiring approval before implementation

1. The first release serves one salon location and one operating day at a time.
2. Currency is assumed to be INR, but the exact displayed currency symbol and tax/invoice behavior are not yet specified.
3. “Notifications” initially means in-app/browser-visible status updates; SMS, WhatsApp, email, and push-provider costs are not included until selected.
4. Authentication method, staff account provisioning, and whether customers need accounts or use a signed status link are still open decisions.
5. The salon's exact timezone, weekly opening hours, holiday/closure rules, and service-duration defaults need confirmation.
6. The business policy for a customer who is Called but arrives before the 10-minute no-show cutoff needs confirmation: the planned default is to keep them Called until reception seats them.

