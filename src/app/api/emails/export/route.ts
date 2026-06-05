import { getEmailsForExport } from "@/lib/stats";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rows = await getEmailsForExport({
    q: searchParams.get("q") ?? undefined,
    eventType: searchParams.get("eventType") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  const csv = toCsv(rows, [
    { key: "createdAt", header: "created_at" },
    { key: "email", header: "email" },
    { key: "companyName", header: "company" },
    { key: "subject", header: "subject" },
    { key: "eventType", header: "event_type" },
    { key: "status", header: "status" },
    { key: "errorMessage", header: "error" },
  ]);

  return csvResponse(csv, "arcom-emails.csv");
}
