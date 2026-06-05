import { ingestSheetRoute } from "@/lib/ingest-route";

export const dynamic = "force-dynamic";

// Accepts a single sheet row: { row: {...} } or a bare row with an `email`.
export async function POST(req: Request) {
  return ingestSheetRoute(req);
}
