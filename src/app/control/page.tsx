import { getAutopilot, getRecentTriggers } from "@/lib/control";
import {
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Badge,
  fmtDate,
  EmptyState,
} from "@/components/ui";
import RunForm from "@/components/RunForm";
import AutopilotForm from "@/components/AutopilotForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ControlPage() {
  const [cfg, triggers] = await Promise.all([
    getAutopilot(),
    getRecentTriggers(15),
  ]);

  const webhookConfigured = Boolean(process.env.N8N_RUN_WEBHOOK_URL);

  return (
    <div>
      <PageHeader
        title="Control"
        subtitle="Trigger the outreach workflow and manage autopilot"
      />

      {!webhookConfigured ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Heads up:</strong> <code>N8N_RUN_WEBHOOK_URL</code> isn&apos;t set
          on the server yet, so runs can&apos;t be triggered. Add it to the
          dashboard&apos;s <code>.env</code> (your n8n URL +{" "}
          <code>/webhook/arcom-dashboard-run</code>) and restart.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Run now
          </div>
          <RunForm />
        </Card>

        <Card>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">Autopilot</div>
            <Badge value={cfg.enabled ? "active" : "idle"} />
          </div>
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              Last run:{" "}
              <span className="font-medium text-slate-700">
                {cfg.lastRunAt ? fmtDate(cfg.lastRunAt) : "never"}
              </span>
            </span>
            <span>
              Next run:{" "}
              <span className="font-medium text-slate-700">
                {cfg.enabled && cfg.nextRunAt ? fmtDate(cfg.nextRunAt) : "—"}
              </span>
            </span>
          </div>
          <AutopilotForm
            initial={{
              enabled: cfg.enabled,
              leadsPerRun: cfg.leadsPerRun,
              intervalMinutes: cfg.intervalMinutes,
              brief: cfg.brief,
              chatId: cfg.chatId,
            }}
          />
        </Card>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-700">
        Recent run triggers
      </h2>
      {triggers.length === 0 ? (
        <EmptyState message="No runs triggered from the dashboard yet." />
      ) : (
        <Table
          head={
            <tr>
              <Th>When</Th>
              <Th>Source</Th>
              <Th>Leads</Th>
              <Th>Brief</Th>
              <Th>Result</Th>
            </tr>
          }
        >
          {triggers.map((t) => (
            <tr key={t.id}>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(t.createdAt)}
              </Td>
              <Td>
                <Badge value={t.source === "autopilot" ? "active" : "sent"} />
                <span className="ml-1 text-xs text-slate-500">{t.source}</span>
              </Td>
              <Td>{t.count}</Td>
              <Td className="max-w-xs truncate">{t.brief || "—"}</Td>
              <Td>
                {t.ok ? (
                  <span className="text-emerald-600">✓ {t.message}</span>
                ) : (
                  <span className="text-red-600">✗ {t.message}</span>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
