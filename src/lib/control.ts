import { prisma } from "./prisma";

function clamp(n: unknown, min: number, max: number, dflt: number): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return dflt;
  return Math.min(Math.max(v, min), max);
}

export async function getAutopilot() {
  return prisma.autopilotConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export interface AutopilotInput {
  enabled?: boolean;
  leadsPerRun?: number;
  intervalMinutes?: number;
  brief?: string;
  chatId?: string;
}

export async function saveAutopilot(input: AutopilotInput) {
  const enabled = !!input.enabled;
  const leadsPerRun = clamp(input.leadsPerRun, 1, 200, 10);
  const intervalMinutes = clamp(input.intervalMinutes, 15, 60 * 24 * 30, 1440);
  const brief = (input.brief ?? "").toString().trim().slice(0, 200) || null;
  const chatId = (input.chatId ?? "").toString().trim().slice(0, 64) || null;

  const current = await getAutopilot();
  // Recompute next run when enabling or changing cadence.
  const base = current.lastRunAt ? new Date(current.lastRunAt).getTime() : Date.now();
  const nextRunAt = enabled
    ? new Date(Math.max(base + intervalMinutes * 60000, Date.now()))
    : null;

  return prisma.autopilotConfig.update({
    where: { id: "default" },
    data: { enabled, leadsPerRun, intervalMinutes, brief, chatId, nextRunAt },
  });
}

export interface TriggerInput {
  count: number;
  brief?: string;
  chatId?: string;
  source: "manual" | "autopilot";
}

export interface TriggerResult {
  ok: boolean;
  message: string;
}

/** Fire the main workflow's dashboard webhook and log the attempt. */
export async function triggerRun(input: TriggerInput): Promise<TriggerResult> {
  const url = process.env.N8N_RUN_WEBHOOK_URL;
  const secret = process.env.N8N_DASHBOARD_SECRET ?? "";
  const count = clamp(input.count, 1, 200, 10);

  let ok = false;
  let message = "";

  if (!url) {
    message = "N8N_RUN_WEBHOOK_URL is not configured on the server.";
  } else {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-Secret": secret,
        },
        body: JSON.stringify({
          count,
          brief: input.brief ?? "",
          chatId: input.chatId ?? "",
        }),
        signal: AbortSignal.timeout(20000),
      });
      ok = res.ok;
      message = `n8n responded ${res.status}`;
    } catch (e) {
      ok = false;
      message = e instanceof Error ? e.message : "request failed";
    }
  }

  await prisma.runTrigger.create({
    data: {
      source: input.source,
      count,
      brief: input.brief ?? null,
      ok,
      message,
    },
  });

  return { ok, message };
}

export async function getRecentTriggers(limit = 15) {
  const rows = await prisma.runTrigger.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    count: r.count,
    brief: r.brief,
    ok: r.ok,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }));
}
