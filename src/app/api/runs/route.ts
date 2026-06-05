import { NextResponse } from "next/server";
import { getRuns } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
  const data = await getRuns(limit);
  return NextResponse.json(data);
}
