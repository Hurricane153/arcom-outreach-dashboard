# Deploy on the Hostinger VPS (next to n8n)

Goal: run the dashboard as a Docker container on the same VPS as n8n, so the
`Arcom Dashboard Stats Sync` and `Arcom Incoming Email Listener` workflows can
reach it. Once connected, the Sync workflow repopulates all leads automatically
on its next run — no manual import needed.

Your VPS: **Ubuntu 24.04**, Docker, public IP **72.61.81.227**.

Open the Hostinger panel → **VPS → Terminal** (or SSH `ssh root@72.61.81.227`).

---

## 1. Get the code onto the VPS

```bash
cd /opt
git clone https://github.com/Hurricane153/arcom-outreach-dashboard.git
cd arcom-outreach-dashboard
```

> If the repo is private, `git clone` will ask for your GitHub username and a
> Personal Access Token (Settings → Developer settings → Tokens) as the password.

## 2. Create the .env

Pick a strong secret and **remember it** — you'll paste the same value into n8n.

```bash
cat > .env <<'EOF'
N8N_DASHBOARD_SECRET=PUT-A-LONG-RANDOM-STRING-HERE
NEXT_PUBLIC_APP_URL=http://72.61.81.227:3001
EOF
```

## 3. Build & start the dashboard

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First build takes a few minutes. Check it's healthy:

```bash
docker logs -f arcom-dashboard      # wait for "Starting Next.js", Ctrl+C to exit
curl -s http://localhost:3001/api/stats/overview   # should return JSON
```

## 4. Put it on n8n's Docker network (so n8n can reach it by name)

Find the network n8n uses:

```bash
docker ps --format '{{.Names}}'                  # find the n8n container name
docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' <n8n_container_name>
```

That prints the network name (often something like `root_default` or
`n8n_default`). Connect the dashboard to it:

```bash
docker network connect <n8n_network_name> arcom-dashboard
```

Now n8n can reach the dashboard at **`http://arcom-dashboard:3000`** internally.

## 5. Configure n8n

In n8n → **Settings → Variables** (or as env on the n8n container) add:

| Key | Value |
|---|---|
| `DASHBOARD_API_URL` | `http://arcom-dashboard:3000` |
| `N8N_DASHBOARD_SECRET` | the exact secret from your `.env` in step 2 |

> If `{{ $env.DASHBOARD_API_URL }}` comes back empty in a test run, your n8n
> reads **process env**, not UI Variables. In that case add the two vars to the
> n8n service environment (Hostinger → Docker Manager → n8n → Environment, or in
> n8n's `docker-compose.yml`) and restart n8n.

## 6. Activate the two workflows

In n8n, open and **activate**:
- **Arcom Dashboard Stats Sync** — runs every 15 min, fills the dashboard from
  the Sent sheet (first run backfills everything).
- **Arcom Incoming Email Listener** — add the IMAP credential first (see
  `docs/N8N_SETUP.md`), then activate.

You can force the first sync immediately: open **Arcom Dashboard Stats Sync** and
click **Execute Workflow**. Then open `http://72.61.81.227:3001/dashboard`.

## 7. View the dashboard

- **Quick:** open `http://72.61.81.227:3001/dashboard`. To allow it through the
  firewall: Hostinger panel → VPS → **Firewall** → allow TCP **3001** (ideally
  restrict the source to your own IP, since the dashboard has no login).
- **Nicer (optional):** put it behind a subdomain with HTTPS via your existing
  reverse proxy (Traefik/Caddy/NPM) and set `NEXT_PUBLIC_APP_URL` to that URL.
  n8n keeps using the internal `http://arcom-dashboard:3000`.

---

## Updating later

```bash
cd /opt/arcom-outreach-dashboard
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

The SQLite data lives in the `arcom_dashboard_data` Docker volume and survives
rebuilds. To wipe and start fresh: `docker compose -f docker-compose.prod.yml
down -v`.

## Security notes

- All `/api/n8n/*` ingestion endpoints require the `X-N8N-Secret` header, so even
  if port 3001 is public, no one can inject data without the secret.
- The read APIs and UI have **no auth**. If you expose port 3001 publicly,
  restrict the firewall to your IP, or front it with HTTP basic-auth on your
  reverse proxy. Keeping n8n→dashboard on the internal Docker network (step 4)
  means you don't have to expose anything publicly at all.
