import { getLeadsPaged, getLeadFilterOptions } from "@/lib/stats";
import {
  PageHeader,
  Table,
  Th,
  Td,
  fmtDate,
  EmptyState,
} from "@/components/ui";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; niche?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const country = sp.country ?? "";
  const niche = sp.niche ?? "";
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  const [data, options] = await Promise.all([
    getLeadsPaged({ q, country, niche, page, pageSize: 25 }),
    getLeadFilterOptions(),
  ]);

  const query: Record<string, string> = { q, country, niche, page: String(page) };
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (country) exportParams.set("country", country);
  if (niche) exportParams.set("niche", niche);

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={`${data.total.toLocaleString()} discovered leads`}
      />

      <Filters
        basePath="/leads"
        query={query}
        q={q}
        searchPlaceholder="Search email / company / website…"
        selects={[
          { name: "country", label: "Country", value: country, options: options.countries },
          { name: "niche", label: "Niche", value: niche, options: options.niches },
        ]}
        exportHref={`/api/leads/export?${exportParams.toString()}`}
      />

      {data.rows.length === 0 ? (
        <EmptyState message="No leads match your filters." />
      ) : (
        <>
          <Table
            head={
              <tr>
                <Th>Email</Th>
                <Th>Company</Th>
                <Th>Website</Th>
                <Th>Country</Th>
                <Th>City</Th>
                <Th>Niche</Th>
                <Th>Created</Th>
              </tr>
            }
          >
            {data.rows.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{l.email ?? "—"}</Td>
                <Td>{l.companyName ?? "—"}</Td>
                <Td className="max-w-[200px] truncate">
                  {l.website ? (
                    <a href={l.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      {l.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>{l.country ?? "—"}</Td>
                <Td>{l.city ?? "—"}</Td>
                <Td>{l.niche ?? "—"}</Td>
                <Td className="whitespace-nowrap text-slate-500">{fmtDate(l.createdAt)}</Td>
              </tr>
            ))}
          </Table>
          <Pagination
            basePath="/leads"
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
