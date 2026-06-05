# Arcom Outreach Dashboard

A simple, clean web dashboard for the Arcom Technologies n8n lead-generation &
outreach system. It shows how many leads were found, emails generated/sent,
follow-ups, replies, bounces, failures, run history, recent leads/emails, daily
stats and incoming replies/bounces.

It is **read-only with respect to your existing workflow** — the dashboard
receives data from two *new* n8n workflows that sit alongside
`KlijentiTrazenjeAutomatizacija_v10_jezici` without modifying it.

```
┌─────────────────────────────────────────┐
│  KlijentiTrazenjeAutomatizacija_v10      │  (UNCHANGED)
│  → writes to Google Sheet "Sent"         │
└───────────────┬─────────────────────────┘
                │ reads (read-only)
        ┌───────▼────────────┐      ┌──────────────────────────┐
        │ Arcom Dashboard    │      │ Arcom Incoming Email      │
        │ Stats Sync (15 min)│      │ Listener (IMAP)           │
        └───────┬────────────┘      └───────────┬──────────────┘
                │ POST /api/n8n/sync-batch       │ POST /api/n8n/{reply,bounce}-detected
                ▼                                ▼
        ┌──────────────────────────────────────────────┐
        │   Arcom Outreach Dashboard (Next.js + Prisma) │
        │   PostgreSQL                                  │
        └──────────────────────────────────────────────┘
```

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · **SQLite** · Prisma ORM.

> **No Docker, no database server.** The database is a single SQLite file
> (`prisma/dev.db`) created automatically. Just install and run.

---

## 1. Quick start

```bash
# 1. install dependencies
npm install

# 2. configure environment
cp .env.example .env
#   - set N8N_DASHBOARD_SECRET to a long random string
#   - DATABASE_URL already points at the local SQLite file (file:./dev.db)

# 3. create the database (one command — makes prisma/dev.db)
npm run setup

# 4. (optional) load demo data so the UI isn't empty
npm run db:seed

# 5. run the dashboard
npm run dev
#   → http://localhost:3000
```

Open <http://localhost:3000>. You will be redirected to `/dashboard`.

> Want to use PostgreSQL instead? Change the `datasource` provider in
> `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at your server,
> and re-run `npx prisma migrate dev`. SQLite is the zero-setup default.

---

## 2. Environment variables

### Dashboard (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path used by Prisma (default `file:./dev.db`). |
| `N8N_DASHBOARD_SECRET` | Shared secret. Every n8n → dashboard request must send it in the `X-N8N-Secret` header, or it gets a **401**. |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the dashboard (display only). |

### n8n (Settings → Variables, or host env)

| Variable | Example | Purpose |
|---|---|---|
| `DASHBOARD_API_URL` | `http://localhost:3000` | Base URL the workflows POST to. **Include the protocol.** |
| `N8N_DASHBOARD_SECRET` | *(same as dashboard)* | Must match the dashboard secret exactly. |

> If n8n runs in Docker and the dashboard runs on the host, use
> `http://host.docker.internal:3000` (or the host LAN IP) for `DASHBOARD_API_URL`.

---

## 3. How the dashboard receives data

All ingestion endpoints are `POST` and require the header
`X-N8N-Secret: <secret>`.

**n8n → dashboard ingestion**

| Endpoint | Used by | Body |
|---|---|---|
| `/api/n8n/sync-batch` | Stats Sync | `{ source, workflowName, syncedAt, rows: [...] }` |
| `/api/n8n/sync-sheet-row` | (single row) | `{ row: {...} }` or a bare row with `email` |
| `/api/n8n/reply-detected` | Email Listener | reply payload (see below) |
| `/api/n8n/bounce-detected` | Email Listener | bounce payload |
| `/api/n8n/workflow-started` | optional | `{ runId, source, rawBrief, requestedCount }` |
| `/api/n8n/workflow-finished` | optional | `{ runId, status, finishedAt, stats }` |
| `/api/n8n/lead-found` | optional | lead fields |
| `/api/n8n/email-generated` | optional | email fields |
| `/api/n8n/email-sent` | optional | email fields |
| `/api/n8n/followup-sent` | optional | email fields |
| `/api/n8n/error` | optional | `{ email, errorMessage }` |
| `/api/n8n/events` | generic | a single event or `{ events: [...] }` |

**Dashboard read APIs (consumed by the UI, no secret required)**

`GET /api/stats/overview` · `GET /api/stats/daily` · `GET /api/runs` ·
`GET /api/runs/:id` · `GET /api/events/recent` · `GET /api/leads/recent` ·
`GET /api/emails/recent` · `GET /api/incoming` · `GET /api/incoming/recent`

### Event processing & de-duplication

When an event arrives the engine (`src/lib/events.ts`):

- creates / updates a `WorkflowRun` when a `runId` is present;
- upserts `DailyStats` by calendar day (UTC) and increments the right counter;
- writes a `LeadEvent` for lead events and an `EmailEvent` for email events;
- writes an `IncomingEmailEvent` for replies/bounces (so they show on `/incoming`);
- **never double counts** — events are deduped by a stable key:
  - `runId + email + eventType` for live workflow events,
  - `email + eventType + timestamp` for rows imported from the sheet,
  - `messageId + eventType` for incoming emails.

Because the sync re-reads the whole sheet every 15 minutes, the timestamp-based
key makes re-syncing **idempotent**: rows already imported are skipped.

---

## 4. The two new n8n workflows

Both are in [`n8n/`](./n8n) and were also created directly in your n8n instance
(inactive, pending credentials). See [`docs/N8N_SETUP.md`](./docs/N8N_SETUP.md)
for step-by-step configuration.

- **`Arcom Dashboard Stats Sync`** — Schedule (every 15 min) → read the `Sent`
  sheet (read-only, reuses your "Google auth" credential) → normalize rows →
  `POST /api/n8n/sync-batch`. Sends no email, never writes to the sheet.
- **`Arcom Incoming Email Listener`** — IMAP trigger → normalize → classify
  reply vs bounce → `POST /api/n8n/{reply,bounce}-detected`. Sends no email.

The existing workflow `KlijentiTrazenjeAutomatizacija_v10_jezici` is **not
touched**.

---

## 5. Pages

| Route | Shows |
|---|---|
| `/dashboard` | Overview cards, daily chart + table, rates, recent events. |
| `/runs` | Run / search / sync history. |
| `/runs/[id]` | One run: brief, stats, leads, generated, sent, errors. |
| `/leads` | Recent leads. |
| `/emails` | Email activity (generated / sent / follow-up / failed / reply / bounce). |
| `/incoming` | Incoming replies & bounces with All / Replies / Bounces filters. |
| `/settings` | Env status, n8n variables, webhook URLs, setup checklist. |

---

## 6. Deliverables map

| Deliverable | Location |
|---|---|
| Dashboard app | `src/` |
| Prisma schema | `prisma/schema.prisma` |
| Migration | `prisma/migrations/` |
| `.env.example` | `./.env.example` |
| README | this file |
| Data-flow docs | this file §3 + `docs/N8N_SETUP.md` |
| n8n variable docs | `docs/N8N_SETUP.md` |
| Sync workflow docs | `docs/N8N_SETUP.md` |
| Listener workflow docs | `docs/N8N_SETUP.md` |
| New workflow JSON | `n8n/*.json` |
| Test checklist | `docs/TEST_CHECKLIST.md` |

---

## 7. Production build

```bash
npm run build      # prisma generate + next build
npm run start      # serves on :3000
```
