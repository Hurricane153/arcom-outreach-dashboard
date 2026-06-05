import { NextResponse } from "next/server";
import { getAutopilot, saveAutopilot } from "@/lib/control";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getAutopilot();
  return NextResponse.json(cfg);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cfg = await saveAutopilot({
    enabled: Boolean(body.enabled),
    leadsPerRun: Number(body.leadsPerRun),
    intervalMinutes: Number(body.intervalMinutes),
    brief: typeof body.brief === "string" ? body.brief : undefined,
    chatId: typeof body.chatId === "string" ? body.chatId : undefined,
  });
  return NextResponse.json({ ok: true, config: cfg });
}
