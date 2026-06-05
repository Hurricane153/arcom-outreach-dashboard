import { getRecentLeads } from "@/lib/stats";
import {
  PageHeader,
  Table,
  Th,
  Td,
  fmtDate,
  EmptyState,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage() {
  const leads = await getRecentLeads(200);

  return (
    <div>
      <PageHeader title="Leads" subtitle="Most recent discovered leads" />

      {leads.length === 0 ? (
        <EmptyState message="No leads yet." />
      ) : (
        <Table
          head={
            <tr>
              <Th>Email</Th>
              <Th>Company</Th>
              <Th>Website</Th>
              <Th>Country</Th>
              <Th>City</Th>
              <Th>Niche</Th>
              <Th>Source</Th>
              <Th>Created</Th>
            </tr>
          }
        >
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{l.email ?? "—"}</Td>
              <Td>{l.companyName ?? "—"}</Td>
              <Td className="max-w-[200px] truncate">
                {l.website ? (
                  <a
                    href={l.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    {l.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td>{l.country ?? "—"}</Td>
              <Td>{l.city ?? "—"}</Td>
              <Td>{l.niche ?? "—"}</Td>
              <Td className="max-w-[200px] truncate">
                {l.sourceUrl ? (
                  <a
                    href={l.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:underline"
                  >
                    link
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap text-slate-500">
                {fmtDate(l.createdAt)}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
