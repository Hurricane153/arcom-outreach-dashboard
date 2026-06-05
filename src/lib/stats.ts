import { prisma } from "./prisma";

/** Decode a JSON string column (SQLite has no native JSON type). */
function parseJson(v: string | null): unknown {
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export interface Overview {
  leadsFound: number;
  emailsGenerated: number;
  emailsSent: number;
  followupsSent: number;
  repliesDetected: number;
  bouncesDetected: number;
  failures: number;
  runs: number;
  lastActivityAt: string | null;
  lastSyncStatus: string;
}

/** Aggregate lifetime totals from the per-day rollups + live tables. */
export async function getOverview(): Promise<Overview> {
  const [agg, runs, lastEmail, lastLead] = await Promise.all([
    prisma.dailyStats.aggregate({
      _sum: {
        leadsFound: true,
        emailsGenerated: true,
        emailsSent: true,
        followupsSent: true,
        repliesDetected: true,
        bouncesDetected: true,
        failures: true,
      },
    }),
    prisma.workflowRun.count(),
    prisma.emailEvent.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.leadEvent.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const lastTimes = [lastEmail?.createdAt, lastLead?.createdAt]
    .filter(Boolean)
    .map((d) => (d as Date).getTime());
  const lastActivityAt =
    lastTimes.length > 0 ? new Date(Math.max(...lastTimes)).toISOString() : null;

  // "Sync status" heuristic: green if we saw activity within the last 30 min.
  let lastSyncStatus = "idle";
  if (lastActivityAt) {
    const ageMin = (Date.now() - new Date(lastActivityAt).getTime()) / 60000;
    lastSyncStatus = ageMin < 30 ? "active" : "stale";
  }

  const s = agg._sum;
  return {
    leadsFound: s.leadsFound ?? 0,
    emailsGenerated: s.emailsGenerated ?? 0,
    emailsSent: s.emailsSent ?? 0,
    followupsSent: s.followupsSent ?? 0,
    repliesDetected: s.repliesDetected ?? 0,
    bouncesDetected: s.bouncesDetected ?? 0,
    failures: s.failures ?? 0,
    runs,
    lastActivityAt,
    lastSyncStatus,
  };
}

/** Daily rollups, most recent first, limited to `days`. */
export async function getDaily(days = 30) {
  const rows = await prisma.dailyStats.findMany({
    orderBy: { date: "desc" },
    take: days,
  });
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    leadsFound: r.leadsFound,
    emailsGenerated: r.emailsGenerated,
    emailsSent: r.emailsSent,
    followupsSent: r.followupsSent,
    repliesDetected: r.repliesDetected,
    bouncesDetected: r.bouncesDetected,
    failures: r.failures,
  }));
}

export async function getRuns(limit = 100) {
  const runs = await prisma.workflowRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { leadEvents: true, emailEvents: true } },
    },
  });

  // total sent / failures per run
  const ids = runs.map((r) => r.id);
  const sentByRun = await prisma.emailEvent.groupBy({
    by: ["workflowRunId", "eventType"],
    where: { workflowRunId: { in: ids } },
    _count: { _all: true },
  });

  const sentMap = new Map<string, { sent: number; failures: number }>();
  for (const g of sentByRun) {
    if (!g.workflowRunId) continue;
    const cur = sentMap.get(g.workflowRunId) ?? { sent: 0, failures: 0 };
    if (g.eventType === "email_sent") cur.sent += g._count._all;
    if (g.eventType === "failed") cur.failures += g._count._all;
    sentMap.set(g.workflowRunId, cur);
  }

  return runs.map((r) => ({
    id: r.id,
    runId: r.runId,
    source: r.source,
    workflowName: r.workflowName,
    rawBrief: r.rawBrief,
    requestedCount: r.requestedCount,
    status: r.status,
    startedAt: r.startedAt?.toISOString() ?? null,
    finishedAt: r.finishedAt?.toISOString() ?? null,
    totalLeads: r._count.leadEvents,
    totalEmails: r._count.emailEvents,
    totalSent: sentMap.get(r.id)?.sent ?? 0,
    failures: sentMap.get(r.id)?.failures ?? 0,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRunDetail(id: string) {
  const run = await prisma.workflowRun.findFirst({
    where: { OR: [{ id }, { runId: id }] },
  });
  if (!run) return null;

  const [leads, emails] = await Promise.all([
    prisma.leadEvent.findMany({
      where: { workflowRunId: run.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.emailEvent.findMany({
      where: { workflowRunId: run.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return {
    run: {
      id: run.id,
      runId: run.runId,
      source: run.source,
      workflowName: run.workflowName,
      rawBrief: run.rawBrief,
      requestedCount: run.requestedCount,
      status: run.status,
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
      stats: parseJson(run.stats),
      createdAt: run.createdAt.toISOString(),
    },
    leads,
    emails,
    emailsGenerated: emails.filter((e) => e.eventType === "email_generated"),
    emailsSent: emails.filter((e) => e.eventType === "email_sent"),
    errors: emails.filter((e) => e.eventType === "failed"),
  };
}

export async function getRecentEvents(limit = 50) {
  const [leads, emails] = await Promise.all([
    prisma.leadEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    prisma.emailEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  const merged = [
    ...leads.map((l) => ({
      id: l.id,
      kind: "lead" as const,
      eventType: l.eventType,
      email: l.email,
      companyName: l.companyName,
      subject: null as string | null,
      status: null as string | null,
      createdAt: l.createdAt.toISOString(),
    })),
    ...emails.map((e) => ({
      id: e.id,
      kind: "email" as const,
      eventType: e.eventType,
      email: e.email,
      companyName: e.companyName,
      subject: e.subject,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);

  return merged;
}

export async function getRecentLeads(limit = 100) {
  const rows = await prisma.leadEvent.findMany({
    where: { eventType: "lead_found" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    companyName: r.companyName,
    website: r.website,
    country: r.country,
    city: r.city,
    niche: r.niche,
    sourceUrl: r.sourceUrl,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRecentEmails(limit = 100) {
  const rows = await prisma.emailEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    companyName: r.companyName,
    subject: r.subject,
    eventType: r.eventType,
    status: r.status,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getIncoming(
  filter: "all" | "replies" | "bounces" = "all",
  limit = 100
) {
  const where =
    filter === "replies"
      ? { eventType: "reply_detected" }
      : filter === "bounces"
      ? { eventType: "bounce_detected" }
      : {};

  const rows = await prisma.incomingEmailEvent.findMany({
    where,
    orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fromName: r.fromName,
    subject: r.subject,
    eventType: r.eventType,
    receivedAt: (r.receivedAt ?? r.createdAt).toISOString(),
    snippet: r.snippet,
  }));
}
