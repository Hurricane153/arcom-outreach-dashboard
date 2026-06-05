import { NextResponse } from "next/server";
import { getRunDetail } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getRunDetail(id);
  if (!data) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
