import Link from "next/link";
import { getRuns } from "@/lib/stats";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Badge,
  fmtDate,
  EmptyState,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RunsPage() {
  const runs = await getRuns(200);

  return (
    <div>
      <PageHeader
        title="Runs"
        subtitle="Workflow, search and sync run history"
      />

      {runs.length === 0 ? (
        <EmptyState message="No runs yet. Runs appear when workflows post workflow_started / workflow_finished events." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Started</Th>
              <Th>Source</Th>
              <Th>Brief</Th>
              <Th>Requested</Th>
              <Th>Status</Th>
              <Th>Leads</Th>
              <Th>Sent</Th>
              <Th>Failures</Th>
              <Th>Finished</Th>
              <Th></Th>
            </tr>
          }
        >
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(r.startedAt ?? r.createdAt)}
              </Td>
              <Td>{r.source ?? "—"}</Td>
              <Td className="max-w-xs truncate">{r.rawBrief ?? "—"}</Td>
              <Td>{r.requestedCount ?? "—"}</Td>
              <Td>
                <Badge value={r.status} />
              </Td>
              <Td>{r.totalLeads}</Td>
              <Td>{r.totalSent}</Td>
              <Td>{r.failures}</Td>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(r.finishedAt)}
              </Td>
              <Td>
                <Link
                  href={`/runs/${r.id}`}
                  className="text-brand hover:underline"
                >
                  View
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
