import { NextResponse } from "next/server";
import { triggerRun } from "@/lib/control";

export const dynamic = "force-dynamic";

// Protected by middleware (requires login). Fires one outreach run.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    count?: number;
    brief?: string;
    chatId?: string;
  };

  const count = Number(body.count);
  if (!Number.isFinite(count) || count < 1) {
    return NextResponse.json(
      { ok: false, message: "Enter a lead count of 1 or more." },
      { status: 400 }
    );
  }

  const result = await triggerRun({
    count,
    brief: body.brief,
    chatId: body.chatId,
    source: "manual",
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
