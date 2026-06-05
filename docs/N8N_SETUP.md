# n8n Setup Guide

How to wire the two new workflows to the dashboard. The existing workflow
`KlijentiTrazenjeAutomatizacija_v10_jezici` is **not modified** at any point.

---

## A. Set the two n8n variables

The new workflows reference `{{ $env.DASHBOARD_API_URL }}` and
`{{ $env.N8N_DASHBOARD_SECRET }}`.

### Option 1 — n8n UI (n8n ≥ 1.x, "Variables")
`Settings → Variables → Add Variable`

| Key | Value |
|---|---|
| `DASHBOARD_API_URL` | `http://localhost:3000` (or your dashboard URL — **with** `http://`/`https://`) |
| `N8N_DASHBOARD_SECRET` | the exact same string as `N8N_DASHBOARD_SECRET` in the dashboard `.env` |

> Note: in some n8n setups `$env` reads **process environment variables**, not
> UI Variables. If `{{ $env.DASHBOARD_API_URL }}` comes back empty in a test
> run, use Option 2.

### Option 2 — host environment variables
Set them where n8n runs and restart n8n. Docker example:

```yaml
# docker-compose.yml (n8n service)
environment:
  - DASHBOARD_API_URL=http://host.docker.internal:3000
  - N8N_DASHBOARD_SECRET=your-long-random-secret
```

> When n8n is in Docker and the dashboard is on the host, use
> `http://host.docker.internal:3000` (Win/Mac) or the host LAN IP (Linux).
> If both run in the same Docker network, use the dashboard service name, e.g.
> `http://dashboard:3000`.

---

## B. Workflow 1 — `Arcom Dashboard Stats Sync`

**Purpose:** every 15 minutes, read the `Sent` sheet (read-only) and push the
rows to the dashboard, which converts them into events. Idempotent — safe to run
forever without creating duplicates.

**Already created in your instance** (inactive). To finish setup:

1. Open the workflow **Arcom Dashboard Stats Sync**.
2. **Read Sent Sheet** node — it is pre-wired to:
   - Document: `KlijentiOutreach_Tracker`
     (`1DNA2ttiZE1NzWpxJ2N_zwCE7KZxIIPa7-Fgel_qFVVQ`)
   - Tab: `Sent` (gid `572639152`)
   - Credential: **Google auth** (the same OAuth credential the main workflow
     uses). Confirm the credential is still selected; re-select if n8n shows it
     blank. *This node only reads — it never writes.*
3. **POST sync-batch to Dashboard** node — uses the two env vars. Nothing to
   change.
4. Click **Execute Workflow** once to test. You should see a `200` from the HTTP
   node and rows appear on the dashboard `/dashboard` and `/leads`.
5. Toggle **Active** on.

Re-import from file if needed: `n8n/Arcom_Dashboard_Stats_Sync.json`.

**Payload it sends** to `POST {DASHBOARD_API_URL}/api/n8n/sync-batch`:

```json
{
  "source": "google_sheets_sync",
  "workflowName": "KlijentiTrazenjeAutomatizacija_v10_jezici",
  "syncedAt": "2026-06-05T09:00:00.000Z",
  "rows": [
    {
      "email": "info@example.de",
      "business_name": "Example GmbH",
      "country": "DE",
      "niche": "dental clinic",
      "language": "de",
      "subject": "…",
      "message_text": "…",
      "follow_up_subject": "…",
      "follow_up_text": "…",
      "status": "sent",
      "timestamp_sent": "2026-06-03T10:00:00.000Z",
      "follow_up_due_date": "2026-06-08T10:00:00.000Z",
      "follow_up_sent_at": ""
    }
  ]
}
```

**Row → event mapping** (done by the dashboard):

| Sheet condition | Event |
|---|---|
| any row with `email` + lead data | `lead_found` |
| has `subject` / `message_text` | `email_generated` |
| `status = sent` or `timestamp_sent` set | `email_sent` |
| `status = followed_up` or `follow_up_sent_at` set | `followup_sent` |
| `status = replied` | `reply_detected` |
| `status = bounced` | `bounce_detected` |
| `status = failed` | `failed` |

---

## C. Workflow 2 — `Arcom Incoming Email Listener`

**Purpose:** watch the outreach inbox over IMAP, classify each new email as a
reply or a bounce, and POST it to the dashboard. Sends no email.

**Already created in your instance** (inactive). To finish setup:

1. Open the workflow **Arcom Incoming Email Listener**.
2. **IMAP Email Trigger** node → **Credential to connect with** → create an
   **IMAP** credential for the outreach mailbox `info@arcom-technologies.hr`:
   - Host: your provider's IMAP host (e.g. `imap.your-host.tld`)
   - Port: `993`, SSL/TLS: on
   - User / Password: the mailbox login
   - (n8n credential type: *IMAP*)
   - `Mailbox = INBOX`, `Action = Mark as Read`, `Format = Resolved`
     (already set).
3. **Log Bounce / Log Reply** nodes — use the two env vars; nothing to change.
4. Send yourself a test email to the inbox, then **Execute / activate** to see
   it appear under `/incoming`.
5. Toggle **Active** on.

Re-import from file if needed: `n8n/Arcom_Incoming_Email_Listener.json`.

**Bounce detection** flags an email as `bounce_detected` when the subject /
sender / body / headers look like a delivery failure (mailer-daemon,
undeliverable, delivery status notification, `550 5.1.1`, multipart/report,
etc.) and tries to recover the failed recipient from `Final-Recipient`,
`X-Failed-Recipients`, `Original-Recipient`, or the body. Everything else is a
`reply_detected`.

**Reply payload** → `POST {DASHBOARD_API_URL}/api/n8n/reply-detected`:

```json
{
  "email": "sender@example.com",
  "fromName": "Sender Name",
  "subject": "Re: …",
  "messageId": "<...>",
  "threadId": "<...>",
  "receivedAt": "2026-06-05T11:00:00.000Z",
  "snippet": "first ~300 chars of the message",
  "eventType": "reply_detected",
  "metadata": { "...": "full normalized email" }
}
```

**Bounce payload** → `POST {DASHBOARD_API_URL}/api/n8n/bounce-detected` — same
shape with `eventType: "bounce_detected"` and `email` set to the detected
bounced recipient when found.

---

## D. Safety guarantees

- Both workflows use HTTP Request nodes with **`neverError: true`** — a
  dashboard outage can never break them.
- The Stats Sync workflow **only reads** the Google Sheet and **sends no email**.
- The Listener workflow **only reads** the inbox and **sends no email**.
- The original workflow's nodes, logic, credentials, sending and Google Sheets
  logging are untouched.
