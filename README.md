# ELITE — Salon & Grooming

**Live site:** [https://salon-queue-management-1.onrender.com/](https://salon-queue-management-1.onrender.com/)

**Demo video:** [▶ Watch the ELITE project demo](https://drive.google.com/file/d/1r2IJvSgDv9111ZSSONdo8iXYFL_fR1_o/view?usp=sharing)

> GitHub README pages do not reliably play Google Drive videos inline. The link opens the playable Drive preview. For an inline preview, upload the video to YouTube as Unlisted or attach it to a GitHub Release, then link a thumbnail in this section.

ELITE is a queue management system for a salon. It shares queue state across customer, reception, barber, owner, and waiting-area screens using a Node.js API and PostgreSQL.

## Screens

- **Home** — salon details, opening status, queue summary, and service preview.
- **Join Queue** — customer details, services, barber preference, and queue registration.
- **My Status** — private status link with position, estimate, and cancellation while waiting.
- **Reception** — walk-ins, queue actions, no-show handling, and barber availability.
- **Barber** — the signed-in barber’s work queue, service controls, and availability.
- **Waiting Display** — public, privacy-safe serving and next-token information.
- **Owner Settings** — hours, services, barbers, staff accounts, and daily statistics.

Staff sign in at `/manage/`. The app redirects each account to its role screen: `/manage/admin`, `/manage/receptionist`, or `/manage/barber`.

## Queue rules

The API and database are authoritative for queue order and status. The implementation supports first-come-first-served ordering, hard specific-barber requests, duplicate active-phone prevention, transactional queue transitions, customer cancellation while waiting, the 10-minute no-show threshold, and the online-joining cutoff before closing. The public waiting display excludes private customer details.

## Technology

- React and Vite, JavaScript ES modules
- Node.js and Express API
- PostgreSQL on Neon
- Server-Sent Events for queue update notifications
- Render Static Site for the frontend and Render Web Service for the API (see `render.yaml`)
- Motion for React, Lucide React, and English/Gujarati translations

## Run locally

Requirements: Node.js 22 or newer and a PostgreSQL database. Install dependencies:

```powershell
npm ci
```

Set the API environment in PowerShell. Use a Neon pooled connection string with SSL enabled; keep credentials out of Git:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
$env:SALON_ID = "elite-primary"
$env:SALON_TIMEZONE = "Asia/Kolkata"
$env:FRONTEND_ORIGIN = "http://localhost:5173"
npm run start:api
```

The API start command applies migrations and seeds the salon and services. Barbers are owner-managed and are not generated as demo records. In a second terminal, create the Vite proxy settings in the ignored `.env.local` file:

```dotenv
VITE_API_URL=http://localhost:10000
```

Then start the frontend:

```powershell
npm run dev
```

Open `http://localhost:5173`. To provision the initial owner, set `OWNER_EMAIL` and `OWNER_PASSWORD` in the API shell (password must be at least 12 characters) and run:

```powershell
npm run db:create-owner
```

## Verify

```powershell
npm test
npm run build
```

The API provides `/api/health` for process health and `/api/ready` for database readiness. A healthy response from `/api/health` alone does not confirm the database is reachable; `/api/ready` should return `{"status":"ready","database":"connected"}`.

## Deploy on Render

The included `render.yaml` describes two services:

1. **API Web Service** — Node runtime, `npm ci` build, `npm run start:api` start, and `/api/health` health check.
2. **Frontend Static Site** — Vite production build from `dist`, with SPA route rewrites.

Set `DATABASE_URL` on the API service to the Neon pooled connection string. Set `SALON_ID` to `elite-primary` and `SALON_TIMEZONE` to `Asia/Kolkata`. The frontend’s `VITE_API_URL` must point to the API service URL, and the API’s `FRONTEND_ORIGIN` must include the frontend origin. After deployment, verify `/api/ready` before testing the website. Never commit `.env`, `.env.local`, database URLs, or staff passwords.

## Salon location

A203, ELITE Salon, Sunday Hub, Katargam, Surat.
