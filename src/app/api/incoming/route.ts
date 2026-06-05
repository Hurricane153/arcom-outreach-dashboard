import { NextResponse } from "next/server";
import { getIncoming } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filterParam = (searchParams.get("filter") ?? "all").toLowerCase();
  const filter =
    filterParam === "replies" || filterParam === "bounces"
      ? (filterParam as "replies" | "bounces")
      : "all";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
  const data = await getIncoming(filter, limit);
  return NextResponse.json(data);
}
