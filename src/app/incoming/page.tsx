import Link from "next/link";
import { getIncoming } from "@/lib/stats";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Badge,
  fmtDate,
  EmptyState,
} from "@/components/ui";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FILTERS: { key: "all" | "replies" | "bounces"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "replies", label: "Replies" },
  { key: "bounces", label: "Bounces" },
];

export default async function IncomingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filterParam = (sp.filter ?? "all").toLowerCase();
  const filter =
    filterParam === "replies" || filterParam === "bounces"
      ? (filterParam as "replies" | "bounces")
      : "all";

  const rows = await getIncoming(filter, 200);

  return (
    <div>
      <PageHeader
        title="Incoming"
        subtitle="Replies and bounces detected by the email listener"
        right={
          <div className="flex flex-col items-end gap-2">
            <AutoRefresh intervalSeconds={30} />
            <div className="flex gap-1">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/incoming" : `/incoming?filter=${f.key}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  filter === f.key
                    ? "bg-brand text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {f.label}
              </Link>
            ))}
            </div>
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState message="No incoming emails recorded yet. Configure the Arcom Incoming Email Listener workflow to populate this." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Received</Th>
              <Th>Type</Th>
              <Th>Sender</Th>
              <Th>From name</Th>
              <Th>Subject</Th>
              <Th>Snippet</Th>
            </tr>
          }
        >
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(r.receivedAt)}
              </Td>
              <Td>
                <Badge value={r.eventType} />
              </Td>
              <Td className="font-medium text-slate-900">{r.email ?? "—"}</Td>
              <Td>{r.fromName ?? "—"}</Td>
              <Td className="max-w-xs truncate">{r.subject ?? "—"}</Td>
              <Td className="max-w-md truncate text-slate-500">
                {r.snippet ?? "—"}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
