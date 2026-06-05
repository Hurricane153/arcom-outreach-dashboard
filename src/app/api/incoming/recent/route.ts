import { NextResponse } from "next/server";
import { getIncoming } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 200);
  const data = await getIncoming("all", limit);
  return NextResponse.json(data);
}
