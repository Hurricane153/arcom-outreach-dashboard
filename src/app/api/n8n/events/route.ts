import { ingestSingleRoute } from "@/lib/ingest-route";

export const dynamic = "force-dynamic";

// Generic ingestion: accepts a single event object or { events: [...] }.
export async function POST(req: Request) {
  return ingestSingleRoute(req);
}
