import { getLeadsForExport } from "@/lib/stats";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rows = await getLeadsForExport({
    q: searchParams.get("q") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    niche: searchParams.get("niche") ?? undefined,
  });

  const csv = toCsv(rows, [
    { key: "createdAt", header: "created_at" },
    { key: "email", header: "email" },
    { key: "companyName", header: "company" },
    { key: "website", header: "website" },
    { key: "country", header: "country" },
    { key: "city", header: "city" },
    { key: "niche", header: "niche" },
    { key: "sourceUrl", header: "source_url" },
  ]);

  return csvResponse(csv, "arcom-leads.csv");
}
