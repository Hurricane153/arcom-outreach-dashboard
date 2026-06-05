import { ingestSheetRoute } from "@/lib/ingest-route";

export const dynamic = "force-dynamic";

// Accepts { source, workflowName, syncedAt, rows: [ {...}, ... ] }
export async function POST(req: Request) {
  return ingestSheetRoute(req);
}
