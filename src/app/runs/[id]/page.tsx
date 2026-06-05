import Link from "next/link";
import { notFound } from "next/navigation";
import { getRunDetail } from "@/lib/stats";
import {
  PageHeader,
  Card,
  StatCard,
  Table,
  Th,
  Td,
  Badge,
  fmtDate,
  EmptyState,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getRunDetail(id);
  if (!detail) notFound();

  const { run, leads, emailsGenerated, emailsSent, errors } = detail;

  return (
    <div>
      <PageHeader
        title="Run detail"
        subtitle={run.runId}
        right={
          <Link href="/runs" className="text-sm text-brand hover:underline">
            ← Back to runs
          </Link>
        }
      />

      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Field label="Status" value={<Badge value={run.status} />} />
          <Field label="Source" value={run.source ?? "—"} />
          <Field label="Workflow" value={run.workflowName ?? "—"} />
          <Field label="Requested" value={run.requestedCount ?? "—"} />
          <Field label="Started" value={fmtDate(run.startedAt)} />
          <Field label="Finished" value={fmtDate(run.finishedAt)} />
        </div>
        {run.rawBrief ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Brief
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {run.rawBrief}
            </p>
          </div>
        ) : null}
        {run.stats ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Stats
            </div>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {JSON.stringify(run.stats, null, 2)}
            </pre>
          </div>
        ) : null}
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Leads" value={leads.length} accent="violet" />
        <StatCard label="Generated" value={emailsGenerated.length} accent="slate" />
        <StatCard label="Sent" value={emailsSent.length} accent="blue" />
        <StatCard label="Errors" value={errors.length} accent="red" />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Leads in this run
      </h2>
      {leads.length === 0 ? (
        <EmptyState message="No leads recorded for this run." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Email</Th>
              <Th>Company</Th>
              <Th>Country</Th>
              <Th>Niche</Th>
              <Th>When</Th>
            </tr>
          }
        >
          {leads.map((l) => (
            <tr key={l.id}>
              <Td className="font-medium text-slate-900">{l.email ?? "—"}</Td>
              <Td>{l.companyName ?? "—"}</Td>
              <Td>{l.country ?? "—"}</Td>
              <Td>{l.niche ?? "—"}</Td>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(l.createdAt)}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
        Emails sent in this run
      </h2>
      {emailsSent.length === 0 ? (
        <EmptyState message="No sent emails recorded for this run." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Email</Th>
              <Th>Company</Th>
              <Th>Subject</Th>
              <Th>When</Th>
            </tr>
          }
        >
          {emailsSent.map((e) => (
            <tr key={e.id}>
              <Td className="font-medium text-slate-900">{e.email ?? "—"}</Td>
              <Td>{e.companyName ?? "—"}</Td>
              <Td className="max-w-xs truncate">{e.subject ?? "—"}</Td>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(e.createdAt)}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {errors.length > 0 ? (
        <>
          <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
            Errors
          </h2>
          <Table
            head={
              <tr>
                <Th>Email</Th>
                <Th>Error</Th>
                <Th>When</Th>
              </tr>
            }
          >
            {errors.map((e) => (
              <tr key={e.id}>
                <Td className="font-medium text-slate-900">{e.email ?? "—"}</Td>
                <Td className="text-red-600">{e.errorMessage ?? "—"}</Td>
                <Td className="whitespace-nowrap text-slate-500">
                  {fmtDate(e.createdAt)}
                </Td>
              </tr>
            ))}
          </Table>
        </>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-slate-800">{value}</div>
    </div>
  );
}
