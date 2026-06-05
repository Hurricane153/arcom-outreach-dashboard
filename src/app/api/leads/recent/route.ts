import { NextResponse } from "next/server";
import { getRecentLeads } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
  const data = await getRecentLeads(limit);
  return NextResponse.json(data);
}
