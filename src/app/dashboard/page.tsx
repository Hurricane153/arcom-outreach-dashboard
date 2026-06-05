import {
  getOverview,
  getDaily,
  getRecentEvents,
  getTopCountries,
  getTopNiches,
} from "@/lib/stats";
import {
  Card,
  StatCard,
  PageHeader,
  Badge,
  Table,
  Th,
  Td,
  fmtDate,
  EmptyState,
} from "@/components/ui";
import DailyChart from "@/components/DailyChart";
import Funnel from "@/components/Funnel";
import BarList from "@/components/BarList";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [overview, daily, events, topCountries, topNiches] = await Promise.all([
    getOverview(),
    getDaily(30),
    getRecentEvents(20),
    getTopCountries(8),
    getTopNiches(8),
  ]);

  const funnelSteps = [
    { label: "Leads found", value: overview.leadsFound, color: "bg-indigo-500" },
    { label: "Emails generated", value: overview.emailsGenerated, color: "bg-slate-500" },
    { label: "Emails sent", value: overview.emailsSent, color: "bg-blue-500" },
    { label: "Follow-ups sent", value: overview.followupsSent, color: "bg-violet-500" },
    { label: "Replies", value: overview.repliesDetected, color: "bg-emerald-500" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live statistics from the Arcom outreach system"
        right={
          <div className="flex flex-col items-end gap-1">
            <AutoRefresh intervalSeconds={30} />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Sync:</span>
              <Badge value={overview.lastSyncStatus} />
              <span className="text-slate-400">
                {overview.lastActivityAt
                  ? fmtDate(overview.lastActivityAt)
                  : "no activity yet"}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Leads found" value={overview.leadsFound.toLocaleString()} accent="violet" />
        <StatCard label="Emails generated" value={overview.emailsGenerated.toLocaleString()} accent="slate" />
        <StatCard label="Emails sent" value={overview.emailsSent.toLocaleString()} accent="blue" />
        <StatCard label="Follow-ups sent" value={overview.followupsSent.toLocaleString()} accent="violet" />
        <StatCard label="Replies" value={overview.repliesDetected.toLocaleString()} accent="green" />
        <StatCard label="Bounces" value={overview.bouncesDetected.toLocaleString()} accent="red" />
        <StatCard label="Failures" value={overview.failures.toLocaleString()} accent="amber" />
        <StatCard label="Runs / syncs" value={overview.runs.toLocaleString()} accent="slate" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Sending activity (last 30 days)
          </div>
          <DailyChart data={daily} />
        </Card>

        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">Rates</div>
          <RateRow label="Reply rate" num={overview.repliesDetected} den={overview.emailsSent} color="bg-emerald-500" />
          <RateRow label="Bounce rate" num={overview.bouncesDetected} den={overview.emailsSent} color="bg-red-500" />
          <RateRow label="Follow-up rate" num={overview.followupsSent} den={overview.emailsSent} color="bg-violet-500" />
          <RateRow label="Failure rate" num={overview.failures} den={overview.emailsSent + overview.failures} color="bg-amber-500" />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Conversion funnel
          </div>
          <Funnel steps={funnelSteps} />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Top countries
          </div>
          <BarList items={topCountries} color="bg-blue-500" />
        </Card>
        <Card>
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Top niches
          </div>
          <BarList items={topNiches} color="bg-violet-500" />
        </Card>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-700">
        Daily statistics
      </h2>
      {daily.length === 0 ? (
        <EmptyState message="No daily statistics yet. Run the sync workflow to populate data." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Date</Th>
              <Th>Leads</Th>
              <Th>Sent</Th>
              <Th>Follow-ups</Th>
              <Th>Replies</Th>
              <Th>Bounces</Th>
              <Th>Failures</Th>
            </tr>
          }
        >
          {daily.map((d) => (
            <tr key={d.date}>
              <Td className="font-medium text-slate-900">{d.date}</Td>
              <Td>{d.leadsFound}</Td>
              <Td>{d.emailsSent}</Td>
              <Td>{d.followupsSent}</Td>
              <Td>{d.repliesDetected}</Td>
              <Td>{d.bouncesDetected}</Td>
              <Td>{d.failures}</Td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-700">
        Recent events
      </h2>
      {events.length === 0 ? (
        <EmptyState message="No events recorded yet." />
      ) : (
        <Table
          head={
            <tr>
              <Th>When</Th>
              <Th>Type</Th>
              <Th>Email</Th>
              <Th>Company</Th>
              <Th>Subject / status</Th>
            </tr>
          }
        >
          {events.map((e) => (
            <tr key={`${e.kind}-${e.id}`}>
              <Td className="whitespace-nowrap text-slate-500">{fmtDate(e.createdAt)}</Td>
              <Td>
                <Badge value={e.eventType} />
              </Td>
              <Td className="font-medium text-slate-900">{e.email ?? "—"}</Td>
              <Td>{e.companyName ?? "—"}</Td>
              <Td className="max-w-xs truncate">
                {e.subject ?? (e.status ? <Badge value={e.status} /> : "—")}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function RateRow({
  label,
  num,
  den,
  color,
}: {
  label: string;
  num: number;
  den: number;
  color: string;
}) {
  const pct = den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-slate-900">
          {pct}% <span className="text-slate-400">({num})</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
