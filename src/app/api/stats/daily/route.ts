import { NextResponse } from "next/server";
import { getDaily } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? 30), 1), 365);
  const data = await getDaily(days);
  return NextResponse.json(data);
}
