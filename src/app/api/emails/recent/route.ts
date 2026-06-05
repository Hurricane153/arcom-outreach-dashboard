import { NextResponse } from "next/server";
import { getRecentEmails } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100), 1), 500);
  const data = await getRecentEmails(limit);
  return NextResponse.json(data);
}
