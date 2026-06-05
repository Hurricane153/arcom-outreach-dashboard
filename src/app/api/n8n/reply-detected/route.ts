import { ingestSingleRoute } from "@/lib/ingest-route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return ingestSingleRoute(req, "reply_detected");
}
