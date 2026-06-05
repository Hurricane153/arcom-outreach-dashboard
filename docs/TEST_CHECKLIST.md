# Test Checklist

Set a shell variable first (PowerShell shown; bash is similar):

```powershell
$SECRET = "your-long-random-secret"   # must equal N8N_DASHBOARD_SECRET
$BASE   = "http://localhost:3000"
```

## 1. App boots (no Docker / no DB server)
- [ ] `npm install` succeeds.
- [ ] `npm run setup` creates the SQLite database (`prisma/dev.db`).
- [ ] `npm run db:seed` (optional) loads demo data.
- [ ] `npm run dev` serves http://localhost:3000 and `/` redirects to `/dashboard`.
- [ ] All pages render: `/dashboard /runs /leads /emails /incoming /settings`.

## 2. Auth / security
- [ ] POST without the header is rejected with **401**:
  ```powershell
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST "$BASE/api/n8n/lead-found" -H "Content-Type: application/json" -d "{}"
  # expect 401
  ```
- [ ] POST with a wrong secret → **401**.
- [ ] POST with the correct secret → **200**.

## 3. Event ingestion
- [ ] `lead_found` inserts a lead:
  ```powershell
  curl.exe -X POST "$BASE/api/n8n/lead-found" -H "X-N8N-Secret: $SECRET" -H "Content-Type: application/json" `
    -d '{"email":"test@example.com","companyName":"Test Co","country":"DE","niche":"hotel","website":"https://example.com","timestamp":"2026-06-05T10:00:00Z"}'
  ```
  → appears on `/leads` and increments "Leads found".
- [ ] `email_sent` increments "Emails sent" and shows on `/emails`.
- [ ] Posting the **same** event again does **not** double count (dedupe).

## 4. Sheet sync (idempotency)
- [ ] Post a batch:
  ```powershell
  curl.exe -X POST "$BASE/api/n8n/sync-batch" -H "X-N8N-Secret: $SECRET" -H "Content-Type: application/json" `
    -d '{"source":"google_sheets_sync","rows":[{"email":"a@b.de","business_name":"B","country":"DE","niche":"hotel","status":"sent","timestamp_sent":"2026-06-05T10:00:00Z","subject":"Hi"}]}'
  ```
  → creates `lead_found` + `email_generated` + `email_sent`.
- [ ] Post the **same** batch again → response shows `created: 0` (all deduped),
  counts unchanged.

## 5. Incoming reply / bounce
- [ ] `reply_detected` shows on `/incoming` (filter **Replies**) and bumps "Replies":
  ```powershell
  curl.exe -X POST "$BASE/api/n8n/reply-detected" -H "X-N8N-Secret: $SECRET" -H "Content-Type: application/json" `
    -d '{"email":"lead@x.com","fromName":"Lead","subject":"Re: hi","messageId":"<m1>","receivedAt":"2026-06-05T11:00:00Z","snippet":"thanks!"}'
  ```
- [ ] `bounce_detected` shows under filter **Bounces** and bumps "Bounces".
- [ ] Re-posting the same `messageId` does not duplicate.

## 6. Runs
- [ ] `workflow_started` then `workflow_finished` (same `runId`) creates one run
  on `/runs`, status `finished`, and `/runs/[id]` opens.

## 7. Read APIs
- [ ] `GET $BASE/api/stats/overview` returns totals.
- [ ] `GET $BASE/api/stats/daily` returns per-day rows.
- [ ] `GET "$BASE/api/incoming?filter=bounces"` returns only bounces.

## 8. n8n workflows
- [ ] **Arcom Dashboard Stats Sync** → Execute once → HTTP node returns 200 and
  data appears on the dashboard.
- [ ] **Arcom Incoming Email Listener** → send a test email → it appears on
  `/incoming` after the trigger fires.
- [ ] A delivery-failure email is classified as a **bounce**, a normal reply as a
  **reply**.

## 9. Non-regression
- [ ] `KlijentiTrazenjeAutomatizacija_v10_jezici` is unchanged and still active.
- [ ] Neither new workflow writes to the Google Sheet or sends email.
