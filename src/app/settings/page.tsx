import { PageHeader, Card, Badge } from "@/components/ui";
import { getOverview } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const N8N_ENDPOINTS = [
  "/api/n8n/sync-batch",
  "/api/n8n/sync-sheet-row",
  "/api/n8n/reply-detected",
  "/api/n8n/bounce-detected",
  "/api/n8n/workflow-started",
  "/api/n8n/workflow-finished",
  "/api/n8n/lead-found",
  "/api/n8n/email-generated",
  "/api/n8n/email-sent",
  "/api/n8n/followup-sent",
  "/api/n8n/error",
  "/api/n8n/events",
];

export default async function SettingsPage() {
  const overview = await getOverview();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const secretConfigured = Boolean(process.env.N8N_DASHBOARD_SECRET);
  const dbConfigured = Boolean(process.env.DATABASE_URL);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configuration & integration reference"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Dashboard environment
          </div>
          <Row
            label="DATABASE_URL"
            value={dbConfigured ? "configured" : "missing"}
            ok={dbConfigured}
          />
          <Row
            label="N8N_DASHBOARD_SECRET"
            value={secretConfigured ? "configured" : "missing"}
            ok={secretConfigured}
          />
          <Row label="NEXT_PUBLIC_APP_URL" value={baseUrl} ok />
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Current sync status:</span>
            <Badge value={overview.lastSyncStatus} />
          </div>
        </Card>

        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            n8n variables to set
          </div>
          <p className="mb-2 text-sm text-slate-600">
            In n8n, open <strong>Settings → Variables</strong> (or set process
            env on the n8n host) and add:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
{`DASHBOARD_API_URL = ${baseUrl}
N8N_DASHBOARD_SECRET = <same secret as this dashboard>`}
          </pre>
          <p className="mt-2 text-xs text-slate-500">
            Every request from n8n must send the header{" "}
            <code className="rounded bg-slate-100 px-1">X-N8N-Secret</code> with
            this value, or it is rejected with HTTP 401.
          </p>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 text-sm font-semibold text-slate-700">
          Webhook / ingestion URLs
        </div>
        <p className="mb-3 text-sm text-slate-600">
          POST JSON to these endpoints (header{" "}
          <code className="rounded bg-slate-100 px-1">
            X-N8N-Secret: &lt;secret&gt;
          </code>
          ). The two used by the new workflows are highlighted.
        </p>
        <div className="space-y-1">
          {N8N_ENDPOINTS.map((e) => {
            const primary =
              e === "/api/n8n/sync-batch" ||
              e === "/api/n8n/reply-detected" ||
              e === "/api/n8n/bounce-detected";
            return (
              <div
                key={e}
                className="flex items-center gap-2 font-mono text-xs text-slate-700"
              >
                <span className="w-12 text-slate-400">POST</span>
                <span className={primary ? "font-semibold text-brand" : ""}>
                  {baseUrl}
                  {e}
                </span>
                {primary ? <Badge value="used by new workflows" /> : null}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="mb-3 text-sm font-semibold text-slate-700">
          Setup checklist
        </div>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
          <li>
            Copy <code className="rounded bg-slate-100 px-1">.env.example</code>{" "}
            to <code className="rounded bg-slate-100 px-1">.env</code> and set a
            strong <code>N8N_DASHBOARD_SECRET</code>.
          </li>
          <li>
            Create the local SQLite database:{" "}
            <code className="rounded bg-slate-100 px-1">npm run setup</code>{" "}
            (no Docker / DB server needed).
          </li>
          <li>
            Start the dashboard:{" "}
            <code className="rounded bg-slate-100 px-1">npm run dev</code>.
          </li>
          <li>
            In n8n, set <code>DASHBOARD_API_URL</code> and{" "}
            <code>N8N_DASHBOARD_SECRET</code>.
          </li>
          <li>
            Import & activate{" "}
            <strong>Arcom Dashboard Stats Sync</strong> and{" "}
            <strong>Arcom Incoming Email Listener</strong>; attach Google Sheets
            and IMAP credentials.
          </li>
          <li>
            The existing workflow{" "}
            <code className="rounded bg-slate-100 px-1">
              KlijentiTrazenjeAutomatizacija_v10_jezici
            </code>{" "}
            stays unchanged.
          </li>
        </ol>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="font-mono text-xs text-slate-600">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
