import { getEmailsPaged } from "@/lib/stats";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Badge,
  fmtDate,
  EmptyState,
} from "@/components/ui";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EVENT_TYPES = [
  "email_generated",
  "email_sent",
  "followup_sent",
  "failed",
  "reply_detected",
  "bounce_detected",
];
const STATUSES = ["sent", "followed_up", "replied", "bounced", "failed"];

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; eventType?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const eventType = sp.eventType ?? "";
  const status = sp.status ?? "";
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  const data = await getEmailsPaged({ q, eventType, status, page, pageSize: 25 });

  const query: Record<string, string> = {
    q,
    eventType,
    status,
    page: String(page),
  };
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (eventType) exportParams.set("eventType", eventType);
  if (status) exportParams.set("status", status);

  return (
    <div>
      <PageHeader
        title="Emails"
        subtitle={`${data.total.toLocaleString()} email events`}
      />

      <Filters
        basePath="/emails"
        query={query}
        q={q}
        searchPlaceholder="Search email / company / subject…"
        selects={[
          { name: "eventType", label: "Event", value: eventType, options: EVENT_TYPES },
          { name: "status", label: "Status", value: status, options: STATUSES },
        ]}
        exportHref={`/api/emails/export?${exportParams.toString()}`}
      />

      {data.rows.length === 0 ? (
        <EmptyState message="No email activity matches your filters." />
      ) : (
        <>
          <Table
            head={
              <tr>
                <Th>Email</Th>
                <Th>Company</Th>
                <Th>Subject</Th>
                <Th>Event</Th>
                <Th>Status</Th>
                <Th>Error</Th>
                <Th>Created</Th>
              </tr>
            }
          >
            {data.rows.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{e.email ?? "—"}</Td>
                <Td>{e.companyName ?? "—"}</Td>
                <Td className="max-w-xs truncate">{e.subject ?? "—"}</Td>
                <Td>
                  <Badge value={e.eventType} />
                </Td>
                <Td>
                  <Badge value={e.status} />
                </Td>
                <Td className="max-w-[200px] truncate text-red-600">{e.errorMessage ?? "—"}</Td>
                <Td className="whitespace-nowrap text-slate-500">{fmtDate(e.createdAt)}</Td>
              </tr>
            ))}
          </Table>
          <Pagination
            basePath="/emails"
            query={query}
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
          />
        </>
      )}
    </div>
  );
}
