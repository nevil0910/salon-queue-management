# ELITE Prompt Archive

This file preserves the project prompts supplied by the user, in chronological order. Wording is kept as provided; later prompts supersede earlier decisions where the project scope changed (for example, the prototype localStorage instruction was later replaced by the Neon/PostgreSQL API requirement).

## Contents

1. [Project Initialization — Premium Salon Queue Management System](#project-initialization--premium-salon-queue-management-system)
2. [Prompt 2 — Project Foundation & Design System](#prompt-2--project-foundation--design-system)
3. [Prompt 3 — ELITE Visual Identity + Home Page + Join Queue](#prompt-3--elite-visual-identity--home-page--join-queue)
4. [Prompt 4 — Complete ELITE Application & Core Queue Management](#prompt-4--complete-elite-application--core-queue-management)
5. [PostgreSQL and Render deployment follow-ups](#postgresql-and-render-deployment-follow-ups)
6. [Documentation, reflection, and demo video request](#documentation-reflection-and-demo-video-request)

---
# Project Initialization — Premium Salon Queue Management System
I want to build a premium, modern, fully functional Salon Queue Management System. This is an MSc IT project, and I want the final result to look and feel like a professionally developed commercial SaaS product, not a typical college assignment.

## 1. Your first responsibility
Before writing any application code, understand the project requirements and prepare the complete project documentation.

Create these four files:

1. `docs/01-brief.md`
2. `docs/02-screens.md`
3. `docs/03-flows-rules.md`
4. `AGENTS.md` (project root)
Do not start implementing the application yet.

## 2. Product identity
Use the following provisional brand identity:

- Brand: ELITE
- Full name: ELITE — Salon & Grooming
- Tagline: Precision. Style. Experience.
- Design direction: Luxury, cinematic, elegant and minimal.
- Primary background: Deep charcoal / near-black.
- Accent: Champagne gold.
- Typography: Elegant serif headings paired with clean modern sans-serif typography.
- UI: Premium cards, subtle glass effects, refined borders, sophisticated shadows and generous spacing.
The application should feel like an expensive luxury grooming brand.

## 3. Application requirements
The system must have seven main screens:

1. Home Page — Salon information, opening status, waiting customers, barber availability and Join Queue.
2. Join Queue — Customer details, service selection, barber selection, price calculation and queue confirmation.
3. My Status — Token number, queue position, estimated waiting time, turn notifications and cancellation.
4. Reception Dashboard — Waiting list, walk-in registration, Call Next, No-show and Cancel controls.
5. Barber View — Current customer, selected services, service timer, Start/Done and break status.
6. Waiting Area TV — Currently serving customers, barber information and next five tokens.
7. Owner Settings — Service management, barber management, queue controls and daily statistics.
Include both customer-facing and staff-facing experiences.

## 4. Queue management rules
Document the following rules carefully:

- First come, first served.
- Customers can select a particular barber or Any Barber.
- A customer requesting a specific barber must never be assigned to another barber.
- A barber can serve only one customer at a time.
- Queue statuses: Waiting → Called → In Chair → Done.
- Waiting customers can cancel.
- Called customers can be marked No-show after 10 minutes.
- A no-show customer who returns must join at the end with a new token.
- Prevent duplicate active registrations using the same phone number.
- Customers must see updated queue positions and estimated waiting times.
- Online joining closes 30 minutes before salon closing; walk-ins remain possible.
- Barber breaks must be handled correctly.
Document additional edge cases and create a test checklist containing at least eight test cases.

## 5. Animation and interaction direction
Animations are a major design priority.

I want a polished animation system throughout the application.

Use Motion for React (Framer Motion) for interface animations. GSAP can be used for advanced cinematic sequences when genuinely useful.

Plan animations including:

- Cinematic logo reveal and intro sequence.
- Smooth page transitions.
- Staggered entrance animations for dashboard cards.
- Elegant hover effects and interactive buttons.
- Animated service selection.
- Smooth price and statistics counters.
- Token generation and reveal animations.
- Animated queue position updates.
- Circular waiting-time progress indicators.
- Premium "YOUR TURN" notification animation.
- Smooth barber status transitions.
- Animated charts and dashboard statistics.
- Subtle background lighting and gold accents.
Important animation principles:

- Animations must feel smooth and intentional, not excessive.
- Avoid unnecessary animation on frequently updating elements.
- Maintain good performance on mobile devices.
- Respect reduced-motion accessibility preferences.
- Never sacrifice functionality for visual effects.

## 6. Technology stack
Plan the project around:

- React
- Vite
- Tailwind CSS
- Motion for React
- GSAP where appropriate
- Lucide React icons
Choose an appropriate routing and storage architecture.

The application must support synchronization between customer, receptionist, barber and TV screens.

Choose the simplest reliable storage solution that supports this requirement. Document the reasoning before implementation.

Deployment target:

**Render is the chosen hosting platform.** Evaluate whether to use a Render Static Site for the frontend and a Render Web Service for the backend. Choose a persistent database compatible with the architecture. Explain the architecture and deployment plan before implementation. Do not use Vercel or Railway.

## 7. Responsive design
Plan the UI for three different environments:

- Customer: Mobile-first experience.
- Receptionist and Owner: Tablet/Desktop dashboard.
- Waiting Area TV: Large-screen landscape display.
The layout must adapt properly to each environment.

Include English and Gujarati language support. Avoid hardcoded interface labels; plan a centralized translation system.

## 8. AGENTS.md instructions
Make AGENTS.md the central instruction file for future development.

It must instruct future AI agents to:

- Read all project documentation before coding.
- Implement one screen or feature at a time.
- Follow the documented queue rules.
- Maintain consistent branding and design.
- Preserve existing working features.
- Never introduce features outside the agreed scope.
- Test changes before declaring them complete.
- Report changed files and testing instructions after each task.

## 9. Your working procedure
Follow these steps:

1. Inspect the current project workspace.
2. Identify anything that already exists.
3. Prepare a clear plan for the four documentation files.
4. Create all four files with detailed, consistent requirements.
5. Check that the documents do not contradict each other.
6. Ensure all seven screens, queue rules, animations, responsive layouts and test cases are documented.
7. Present a summary of the documents created and any assumptions that need my approval.

## Important restrictions

- DO NOT build the actual application yet.
- DO NOT generate unnecessary source code.
- DO NOT skip any of the four documentation files.
- DO NOT make major architectural decisions without explaining them.
- DO NOT blindly copy generic templates.
- Ask me if an essential requirement is ambiguous rather than inventing business rules.
For now, your only deliverable is the four complete project documentation files and a clear implementation roadmap.

Make the documentation detailed enough that another AI coding agent can build the entire application without guessing important requirements.


Review all four project documentation files:

- docs/01-brief.md
- docs/02-screens.md
- docs/03-flows-rules.md
- AGENTS.md
Do not modify any files.

Perform a consistency and quality audit. Check:

1. Assignment requirement coverage.
2. All seven screens and their functionality.
3. Queue rules and edge cases.
4. Real-time synchronization and database architecture.
5. Render deployment configuration.
6. Animation and responsive design requirements.
7. English/Gujarati localization.
8. Missing requirements and contradictions between documents.
Return one consolidated report under 600 words, organized into:

- Overall assessment
- Critical issues
- Minor issues
- Unresolved decisions
- Recommended corrections
Do not assume something is implemented merely because it is documented. Distinguish missing documentation from architectural uncertainty.

The project documentation has been reviewed and approved.

Now initialize Git if it is not already initialized.

Before committing:

1. Check the current Git status.
2. Verify that these four files exist:

- docs/01-brief.md
- docs/02-screens.md
- docs/03-flows-rules.md
- AGENTS.md
3. Do not include unrelated files, secrets, credentials or temporary files.
4. Create a .gitignore suitable for the planned React + Vite project, without deleting existing valid rules.
5. Stage only the approved documentation and relevant .gitignore changes.
6. Create the commit with this message:

`docs: add project planning and architecture documentation`
7. Show me the commit hash and final Git status.
Do not create application code, install dependencies or begin implementation.


# Prompt 2 — Project Foundation & Design System
We are now beginning the implementation of ELITE — Salon & Grooming.

Before making any changes, read and understand all four project documentation files:

- `AGENTS.md`
- `docs/01-brief.md`
- `docs/02-screens.md`
- `docs/03-flows-rules.md`
These documents are the source of truth. Follow their requirements throughout implementation.

## 1. Your objective
Establish the complete frontend foundation of the application.

This milestone should produce:

- A working React + Vite application.
- Configured styling and animation libraries.
- A consistent ELITE design system.
- Application routing for all seven screens.
- Responsive page layouts.
- English and Gujarati language switching.
- Reusable layout and UI components.
Do not implement actual salon queue functionality yet.

## 2. Technology stack
Use:

- React with JavaScript.
- Vite.
- Tailwind CSS.
- React Router.
- Motion for React (`motion` package).
- GSAP only if genuinely needed at this stage.
- Lucide React for icons.
Use compatible, stable package versions.

Do not introduce unnecessary dependencies.

## 3. Project structure
Create a clean and scalable folder structure.

Suggested structure:

```
src/
├── assets/
├── components/
│   ├── common/
│   ├── layout/
│   └── ui/
├── pages/
│   ├── Home.jsx
│   ├── JoinQueue.jsx
│   ├── MyStatus.jsx
│   ├── ReceptionDashboard.jsx
│   ├── BarberView.jsx
│   ├── WaitingDisplay.jsx
│   └── OwnerSettings.jsx
├── layouts/
├── routes/
├── i18n/
│   ├── translations.js
│   └── LanguageContext.jsx
├── hooks/
├── lib/
├── styles/
├── App.jsx
└── main.jsx
```
You may improve this structure if necessary, but keep it understandable and avoid unnecessary abstraction.

## 4. Design system — ELITE
Brand:
ELITE — Salon & Grooming

Tagline:
Precision. Style. Experience.

Visual direction:

- Premium luxury grooming brand.
- Deep charcoal and near-black backgrounds.
- Champagne gold accents.
- Elegant serif headings.
- Clean modern sans-serif body typography.
- Refined borders.
- Sophisticated shadows.
- Subtle glass effects.
- Generous spacing.
- Excellent typography hierarchy.
Create reusable design tokens for:

- Colors.
- Typography.
- Spacing.
- Border radius.
- Shadows.
- Transitions.
Avoid generic dashboard templates and excessive gradients.

The visual identity must remain consistent across all seven screens.

## 5. Application routing
Configure React Router with these routes:

Route | Screen

`/` | Home Page

`/join` | Join Queue

`/status/:id` | My Status

`/reception` | Reception Dashboard

`/barber/:name` | Barber View

`/display` | Waiting Area TV

`/admin` | Owner Settings
Every route must render its corresponding page.

Create a suitable not-found page.

Do not leave routes broken or pointing to the same placeholder component.

## 6. Localization
Implement centralized English and Gujarati language support.

Requirements:

- English as the default language.
- A language switcher accessible from the appropriate shared layout.
- Store translations centrally.
- All interface labels should use translation keys.
- Avoid hardcoding visible interface text inside components.
- Language switching should update the interface immediately.
For now, include translations for the shared layout, navigation and initial screen headings.

Do not translate dynamic customer data.

## 7. Responsive layouts
Prepare the foundation for three environments:

**Customer-facing screens**

- Mobile-first.
- Touch-friendly controls.
- Clear navigation.
- Proper spacing on small screens.
**Staff and owner screens**

- Tablet and desktop layouts.
- Efficient dashboard structure.
- Responsive navigation and content areas.
**Waiting Area TV**

- Landscape-oriented.
- Full-screen presentation.
- Large readable typography.
- Minimal navigation and distractions.
Follow the screen specifications in `docs/02-screens.md`.

## 8. Animation foundation
Configure Motion for React.

Establish reusable animation patterns for:

- Page transitions.
- Fade and slide entrances.
- Staggered content.
- Button interactions.
- Modal transitions.
Keep animations subtle at this stage.

Do not create the complete cinematic intro or complex screen-specific animations yet.

Respect `prefers-reduced-motion`.

## 9. Shared components
Create reusable foundational components where appropriate:

- Application layout.
- Navigation.
- Brand logo/wordmark.
- Language switcher.
- Page container.
- Reusable buttons.
- Reusable cards.
- Loading state.
- Not-found page.
Avoid building components that have no current purpose.

## 10. Important restrictions

- Do not implement queue management logic.
- Do not implement customer registration.
- Do not implement authentication.
- Do not create database connections.
- Do not create backend services.
- Do not add mock functionality that pretends to be real.
- Do not implement the detailed content and interactions of all seven screens yet.
- Do not modify the approved documentation unless absolutely necessary. Report any conflicts instead.
This milestone is strictly about the frontend foundation.

## 11. Testing and verification
After implementation:

1. Install required dependencies.
2. Run the development server.
3. Verify all seven routes.
4. Check the browser console for errors.
5. Test language switching.
6. Test responsive layouts at mobile, tablet and desktop sizes.
7. Verify animations respect reduced-motion preferences.
8. Run the production build and fix any errors.

## 12. Final report
When finished, report:

- Project structure created.
- Dependencies installed.
- Routes implemented.
- Components created.
- Localization implementation.
- Design system details.
- Tests performed and their results.
- Any known limitations or unresolved issues.
- Exact command to run the application locally.
Do not proceed to the next development milestone.

Wait for my review and approval.

# Prompt 3 — ELITE Visual Identity + Home Page + Join Queue
We are continuing development of ELITE — Salon & Grooming.

Before making changes, read:

- AGENTS.md
- docs/01-brief.md
- docs/02-screens.md
- docs/03-flows-rules.md
Inspect the existing implementation and reuse the components, routing, localization and design system established in Prompt 2.

## 1. Update the visual identity
We are changing the previous charcoal-and-gold palette.

New official visual direction:

- Deep Teal: #102E2B
- Warm Ivory: #F3EEE4
- Burnished Copper: #B97855
- Jade Green: #2F6B5F
- Graphite: #252D2A
Design principles:

- Premium boutique grooming aesthetic.
- Warm, sophisticated and distinctive.
- Elegant serif headings.
- Modern sans-serif body typography.
- Beautiful contrast between light and dark surfaces.
- Copper used selectively for important actions and highlights.
- Subtle textures, refined borders and soft shadows.
- Avoid excessive gradients and generic SaaS styling.
Update the existing centralized design tokens. Do not scatter hardcoded colours throughout components.

Ensure accessible text contrast.

## 2. Implement Home Page
Route: `/`

Build the complete customer-facing landing page.

Include:

- ELITE branding and navigation.
- Premium hero section with strong typography.
- Salon introduction.
- Opening status.
- Current waiting information.
- Barber availability.
- Available services preview.
- Clear Join Queue call-to-action.
- Salon information and footer.
The page should feel like a premium commercial grooming website.

Use polished typography, spacing, responsive layouts and subtle Motion animations.

## 3. Implement Join Queue
Route: `/join`

Build a complete customer registration experience.

Required fields:

- Customer name.
- Phone number.
- Service selection.
- Barber selection.
Service selection must:

- Display service name.
- Display price.
- Display estimated duration.
- Support selecting multiple services if permitted by the project documentation.
- Update the total price and duration automatically.
Barber selection must:

- Show available barbers.
- Allow Any Available Barber.
- Respect barber availability and break status.
- Never silently replace a customer's specific barber preference.
Add:

- Form validation.
- Duplicate active phone-number prevention.
- Clear error messages.
- Loading and success states.
- Mobile-friendly form layout.

## 4. Queue confirmation
After successful registration:

- Generate a unique token.
- Display the token prominently.
- Show selected services.
- Show selected barber.
- Show estimated waiting time if available.
- Provide a link to the customer's status page.
Use the route `/status/:id` for the status link.

## 5. Data handling
Inspect the documented architecture before implementing data handling.

Do not invent a separate backend architecture.

If backend integration is scheduled for a later milestone, implement a clean temporary persistence layer using the simplest appropriate approach, preferably localStorage behind a centralized service/repository abstraction.

The registration flow must not pretend to provide real cross-device synchronization before a backend exists.

Keep the data structure compatible with the documented future backend architecture.

## 6. Localization
All visible text must support English and Gujarati through the existing centralized translation system.

Do not hardcode labels inside the page components.

## 7. Animations
Use Motion for React.

Include:

- Smooth hero entrance.
- Staggered service cards.
- Elegant button interactions.
- Animated service selection.
- Smooth price updates.
- Token reveal animation.
- Refined page transitions.
Avoid excessive animations and respect reduced-motion preferences.

## 8. Quality requirements

- Reuse existing components.
- Keep the code clean and maintainable.
- Do not break existing routes.
- Do not modify unrelated screens.
- Ensure responsive behaviour.
- Do not use arbitrary placeholder content where documented data is available.
- Do not introduce unnecessary dependencies.

## 9. Testing
Verify:

1. Home page renders correctly.
2. Join Queue navigation works.
3. Required fields are validated.
4. Service selection updates price and duration.
5. Barber selection works.
6. Duplicate active registration is rejected.
7. Successful registration generates a unique token.
8. Confirmation displays correct details.
9. Language switching works.
10. Production build succeeds.

## 10. Final report
Report:

- Files created and modified.
- Features implemented.
- Data persistence approach.
- Tests performed.
- Build status.
- Known limitations.
Do not start Prompt 4 or implement the My Status screen.

Wait for my review.

Before proceeding, resolve the documented TypeScript/JavaScript inconsistency.

The approved project brief specifies TypeScript, but the implemented application currently uses JavaScript.

For this assignment, retain JavaScript to avoid an unnecessary migration under the current deadline.

Update the relevant project documentation and AGENTS.md to consistently specify JavaScript. Do not change application functionality.

Then:

1. Inspect Git status and review the changes.
2. Ensure no unrelated files or secrets are staged.
3. Run npm run build.
4. Commit the completed Prompt 2 and Prompt 3 implementation with:
`feat: establish ELITE frontend and customer queue registration`

1. Push the commit.
2. Report the commit hash and final Git status.
Do not begin the next milestone.

# Prompt 4 — Complete ELITE Application & Core Queue Management
We are continuing the ELITE — Salon & Grooming project.

The previous milestones are complete:

- Project foundation and design system.
- Seven application routes.
- English/Gujarati localization.
- Home Page.
- Join Queue.
- Customer registration with token generation.
- Centralized localStorage queue repository.
The latest implementation is committed to Git.

## 1. Read project documentation
Before making changes, read:

- AGENTS.md
- docs/01-brief.md
- docs/02-screens.md
- docs/03-flows-rules.md
Inspect the existing codebase carefully.

Reuse the existing components, design tokens, translations, queue repository and data models.

Do not rebuild existing working functionality from scratch.

## 2. Main objective
Complete the remaining five screens and connect all seven screens into one functional salon queue management application.

The remaining screens are:

1. My Status — `/status/:id`
2. Reception Dashboard — `/reception`
3. Barber View — `/barber/:name`
4. Waiting Area TV — `/display`
5. Owner Settings — `/admin`
The Home Page and Join Queue must continue working.

## 3. My Status
Implement the complete customer status experience.

Display:

- Customer name.
- Token number.
- Queue position.
- Selected services.
- Selected barber.
- Estimated waiting time when calculable.
- Current queue status.
- Progress through Waiting → Called → In Chair → Done.
Include:

- Animated status transitions.
- Clear cancellation action.
- Cancellation confirmation dialog.
- Appropriate empty, invalid-token and completed states.
- Automatic updates when queue data changes.
The status page must use the existing unique customer ID.

## 4. Reception Dashboard
Build a complete receptionist management interface.

Include:

- Waiting customers.
- Called customers.
- Customers currently in service.
- Completed customers.
- Walk-in registration.
- Call Next.
- Manual customer calling.
- Mark No-show.
- Cancel registration.
- Customer search.
- Queue statistics.
Rules:

- Respect first come, first served.
- Respect specific barber preferences.
- Never assign a customer to another barber against their preference.
- Prevent a barber from receiving multiple active customers.
- A Called customer can be marked No-show only after 10 minutes.
- Handle cancellations and queue position updates correctly.
Make the dashboard efficient on tablets and desktops.

## 5. Barber View
Implement the barber interface.

Include:

- Barber identity.
- Availability status.
- Current customer.
- Customer token.
- Selected services.
- Service duration.
- Service timer.
- Start Service.
- Complete Service.
- Break status controls.
Rules:

- A barber can serve one customer at a time.
- A barber cannot receive new customers while on break.
- A barber with an active customer must finish the service before taking a break.
- Completing a service updates the shared queue repository.
- The next eligible customer can then be called by reception.
Make the interface mobile-friendly with large touch targets.

## 6. Waiting Area TV
Implement `/display` as a full-screen landscape waiting-area display.

Include:

- ELITE branding.
- Currently serving customers.
- Barber names.
- Next five queue tokens.
- Clear typography visible from a distance.
- Elegant subtle animations.
- Automatic updates.
Avoid unnecessary navigation and small text.

## 7. Owner Settings
Implement `/admin`.

Include functional management for:

- Services: create, edit and delete.
- Service prices and durations.
- Barbers: create, edit and manage availability.
- Salon opening and closing hours.
- Online queue closing cutoff.
- Queue controls.
- Daily statistics.
Ensure settings affect the actual application rather than being decorative controls.

Add confirmation before destructive actions.

## 8. Centralized queue logic
This is critical.

Keep queue business rules centralized in the existing service/repository architecture.

Do not duplicate queue logic across screens.

Implement and verify:

- Unique token generation.
- First come, first served.
- Specific barber preference.
- Any Available Barber.
- Duplicate active phone prevention.
- Waiting → Called → In Chair → Done.
- Waiting → Cancelled.
- Called → No-show.
- 10-minute no-show rule.
- Returning no-show customers joining at the end.
- Queue position recalculation.
- Estimated waiting-time calculation.
- Online joining cutoff 30 minutes before closing.
- Walk-ins allowed after online queue closes.
- Barber break handling.
Do not silently discard customers or change their barber preference.

## 9. Data and synchronization for this milestone
Continue using the existing centralized queue repository and localStorage for now.

Requirements:

- All screens must use the same repository.
- Changes must immediately reflect across screens.
- Support updates across browser tabs using appropriate storage-event handling.
- Keep data models compatible with the planned Node.js backend and PostgreSQL architecture.
Be transparent that localStorage does not provide cross-device synchronization.

Do not create a fake real-time backend.

## 10. Design and animations
Maintain the new ELITE identity:

- Deep Teal: #102E2B
- Warm Ivory: #F3EEE4
- Burnished Copper: #B97855
- Jade Green: #2F6B5F
- Graphite: #252D2A
Use Motion for React.

Maintain the premium boutique grooming aesthetic.

Add polished interactions and meaningful animations, but prioritize functionality and performance.

Ensure every screen supports English and Gujarati.

Respect reduced-motion preferences.

## 11. Testing
Test the complete customer-to-staff workflow:

1. Customer joins the queue.
2. Unique token is generated.
3. Customer sees their status.
4. Receptionist sees the new registration.
5. Receptionist calls the customer.
6. Customer status changes to Called.
7. Barber sees the assigned customer.
8. Barber starts the service.
9. Customer status changes to In Chair.
10. Barber completes the service.
11. Customer status changes to Done.
12. Next eligible customer can be called.
Also test:

- Duplicate phone registration.
- Cancellation.
- No-show after 10 minutes.
- Specific barber preference.
- Barber break.
- Online queue cutoff.
- Walk-in registration.
- Owner service changes.
- Owner barber changes.
- English/Gujarati switching.
- Responsive layouts.
Do not rely only on visual inspection. Exercise actual interactions.

## 12. Final verification
Run:

- npm run build.
- Relevant automated tests if available.
- Browser checks for all seven routes.
- Complete end-to-end queue workflow.
Fix all errors found.

## 13. Git and final report
Do not commit automatically.

Report:

- Files created and modified.
- Functionality implemented.
- Queue rules implemented.
- Tests performed and results.
- Known limitations.
- Remaining work required for backend integration.
Do not start the backend or deployment in this milestone.

Wait for my review.

so what remains now?, postgre and render deployment?
right? yea or no

So integrate postgre, neon postgre is better for free tier,
deployment need to done in render so ready the projects for deployment and tell me steps to deploy it on render. 



Continue the existing ELITE Salon & Grooming project from its current repository state.

Read AGENTS.md and inspect the existing implementation, especially server/, render.yaml, the database schema/migrations, queueRepository.js and queueEngine.js.

The PostgreSQL/API and Render deployment foundation has already been created, but the frontend still uses localStorage.

Your remaining tasks are strictly:

1. Complete PostgreSQL integration using Neon.
2. Replace localStorage as the authoritative data source with the backend API.
3. Connect all seven existing screens without changing their UI or business rules.
4. Implement the agreed minimal authentication:
   - Staff email/password login.
   - Owner-provisioned staff accounts.
   - Private customer status links.
   - Public privacy-safe waiting display.
5. Prepare and verify Render deployment.

Do not recreate existing features, redesign screens, add unrelated functionality, or commit changes.

Run tests and production builds. Clearly report anything requiring external credentials or manual deployment.
