import { getRecentEmails } from "@/lib/stats";
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

export default async function EmailsPage() {
  const emails = await getRecentEmails(200);

  return (
    <div>
      <PageHeader title="Emails" subtitle="Email activity across the system" />

      {emails.length === 0 ? (
        <EmptyState message="No email activity yet." />
      ) : (
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
          {emails.map((e) => (
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
              <Td className="max-w-[200px] truncate text-red-600">
                {e.errorMessage ?? "—"}
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(e.createdAt)}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
