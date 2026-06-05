import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { IncomingEvent, SheetRow } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an ISO string into a Date, or null if invalid/empty. */
function parseDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Bucket a timestamp to a UTC calendar-day Date (midnight UTC). */
function bucketDate(v?: string | Date | null): Date {
  const d = v instanceof Date ? v : parseDate(v ?? undefined) ?? new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function clean(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function lower(v: unknown): string | undefined {
  const s = clean(v);
  return s ? s.toLowerCase() : undefined;
}

/** SQLite has no JSON type — store structured payloads as a JSON string. */
function toJson(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  try {
    return JSON.stringify(v);
  } catch {
    return undefined;
  }
}

// Which DailyStats counter (if any) a given event type increments.
const DAILY_FIELD: Record<string, keyof Prisma.DailyStatsUpdateInput> = {
  lead_found: "leadsFound",
  email_generated: "emailsGenerated",
  email_sent: "emailsSent",
  followup_sent: "followupsSent",
  reply_detected: "repliesDetected",
  bounce_detected: "bouncesDetected",
  failed: "failures",
};

const LEAD_EVENT_TYPES = new Set([
  "lead_found",
  "skipped_duplicate",
  "skipped_unsubscribed",
  "skipped_blacklisted",
  "synced_from_sheet",
]);

const EMAIL_EVENT_TYPES = new Set([
  "email_generated",
  "email_sent",
  "followup_sent",
  "failed",
  "reply_detected",
  "bounce_detected",
]);

const INCOMING_EVENT_TYPES = new Set(["reply_detected", "bounce_detected"]);

export interface IngestResult {
  eventType: string;
  created: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Daily stats
// ---------------------------------------------------------------------------

async function incrementDaily(eventType: string, date: Date): Promise<void> {
  const field = DAILY_FIELD[eventType];
  if (!field) return;
  await prisma.dailyStats.upsert({
    where: { date },
    create: { date, [field]: 1 } as Prisma.DailyStatsCreateInput,
    update: { [field]: { increment: 1 } } as Prisma.DailyStatsUpdateInput,
  });
}

// ---------------------------------------------------------------------------
// Workflow runs
// ---------------------------------------------------------------------------

/**
 * Create or update a WorkflowRun by its external runId. Returns the internal
 * row id, or null when no runId was supplied.
 */
async function ensureRun(evt: IncomingEvent): Promise<string | null> {
  const runId = clean(evt.runId);
  if (!runId) return null;

  const startedAt = parseDate(evt.startedAt);
  const finishedAt = parseDate(evt.finishedAt);

  const run = await prisma.workflowRun.upsert({
    where: { runId },
    create: {
      runId,
      source: clean(evt.source),
      workflowName: clean(evt.workflowName),
      rawBrief: clean(evt.rawBrief),
      requestedCount:
        typeof evt.requestedCount === "number" ? evt.requestedCount : undefined,
      status: clean(evt.status) ?? "running",
      startedAt: startedAt ?? new Date(),
      finishedAt: finishedAt ?? undefined,
      stats: toJson(evt.stats),
    },
    update: {
      // Only overwrite fields that were actually provided.
      source: clean(evt.source) ?? undefined,
      workflowName: clean(evt.workflowName) ?? undefined,
      rawBrief: clean(evt.rawBrief) ?? undefined,
      requestedCount:
        typeof evt.requestedCount === "number" ? evt.requestedCount : undefined,
      status: clean(evt.status) ?? undefined,
      finishedAt: finishedAt ?? undefined,
      stats: toJson(evt.stats),
    },
  });

  return run.id;
}

// ---------------------------------------------------------------------------
// Deduped create helpers
// ---------------------------------------------------------------------------

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

async function createLeadDeduped(
  data: Prisma.LeadEventCreateInput,
  dedupeKey?: string
): Promise<boolean> {
  if (dedupeKey) {
    const existing = await prisma.leadEvent.findUnique({ where: { dedupeKey } });
    if (existing) return false;
  }
  try {
    await prisma.leadEvent.create({ data: { ...data, dedupeKey } });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

async function createEmailDeduped(
  data: Prisma.EmailEventCreateInput,
  dedupeKey?: string
): Promise<boolean> {
  if (dedupeKey) {
    const existing = await prisma.emailEvent.findUnique({ where: { dedupeKey } });
    if (existing) return false;
  }
  try {
    await prisma.emailEvent.create({ data: { ...data, dedupeKey } });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

async function createIncomingDeduped(
  data: Prisma.IncomingEmailEventCreateInput,
  dedupeKey?: string
): Promise<boolean> {
  if (dedupeKey) {
    const existing = await prisma.incomingEmailEvent.findUnique({
      where: { dedupeKey },
    });
    if (existing) return false;
  }
  try {
    await prisma.incomingEmailEvent.create({ data: { ...data, dedupeKey } });
    return true;
  } catch (e) {
    if (isUniqueViolation(e)) return false;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Dedupe-key derivation
//   - runId + email + eventType        (live workflow events)
//   - email + eventType + timestamp    (imported from sheet)
//   - messageId + eventType            (incoming emails)
// ---------------------------------------------------------------------------

function deriveDedupeKey(evt: IncomingEvent): string | undefined {
  const explicit = clean(evt.dedupeKey);
  if (explicit) return explicit;
  const email = lower(evt.email);
  const runId = clean(evt.runId);
  const ts = clean(evt.timestamp) ?? clean(evt.receivedAt);
  const msg = clean(evt.messageId);

  if (msg && INCOMING_EVENT_TYPES.has(evt.eventType)) {
    return `${msg}|${evt.eventType}`;
  }
  if (runId && email) {
    return `${runId}|${email}|${evt.eventType}`;
  }
  if (email && ts) {
    return `${email}|${evt.eventType}|${ts}`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Main single-event ingestion
// ---------------------------------------------------------------------------

export async function ingestEvent(evt: IncomingEvent): Promise<IngestResult> {
  const eventType = clean(evt.eventType);
  if (!eventType) {
    return { eventType: "(none)", created: false, reason: "missing eventType" };
  }

  // Run lifecycle events only touch WorkflowRun.
  if (eventType === "workflow_started") {
    await ensureRun({ ...evt, status: clean(evt.status) ?? "running" });
    return { eventType, created: true };
  }
  if (eventType === "workflow_finished") {
    await ensureRun({
      ...evt,
      status: clean(evt.status) ?? "finished",
      finishedAt: evt.finishedAt ?? new Date().toISOString(),
    });
    return { eventType, created: true };
  }

  const workflowRunId = await ensureRun(evt); // links event to a run if runId present
  const date = bucketDate(evt.timestamp ?? evt.receivedAt ?? evt.finishedAt);
  const dedupeKey = deriveDedupeKey(evt);
  const metadata = toJson(evt.metadata);

  let created = false;

  if (LEAD_EVENT_TYPES.has(eventType)) {
    created = await createLeadDeduped(
      {
        eventType,
        email: lower(evt.email),
        companyName: clean(evt.companyName),
        website: clean(evt.website),
        country: clean(evt.country),
        city: clean(evt.city),
        niche: clean(evt.niche),
        sourceUrl: clean(evt.sourceUrl),
        metadata,
        ...(workflowRunId
          ? { workflowRun: { connect: { id: workflowRunId } } }
          : {}),
      },
      dedupeKey
    );
    if (created) await incrementDaily(eventType, date);
    return { eventType, created };
  }

  if (EMAIL_EVENT_TYPES.has(eventType)) {
    created = await createEmailDeduped(
      {
        eventType,
        email: lower(evt.email),
        companyName: clean(evt.companyName),
        subject: clean(evt.subject),
        status: clean(evt.status),
        errorMessage: clean(evt.errorMessage),
        metadata,
        ...(workflowRunId
          ? { workflowRun: { connect: { id: workflowRunId } } }
          : {}),
      },
      dedupeKey
    );
    if (created) await incrementDaily(eventType, date);

    // Replies and bounces are also surfaced on the /incoming page.
    if (INCOMING_EVENT_TYPES.has(eventType)) {
      const inKey = clean(evt.messageId)
        ? `${clean(evt.messageId)}|${eventType}`
        : dedupeKey;
      await createIncomingDeduped(
        {
          eventType,
          email: clean(evt.email),
          emailLower: lower(evt.email),
          fromName: clean(evt.fromName),
          subject: clean(evt.subject),
          messageId: clean(evt.messageId),
          threadId: clean(evt.threadId),
          receivedAt: parseDate(evt.receivedAt) ?? undefined,
          snippet: clean(evt.snippet),
          metadata,
        },
        inKey
      );
    }
    return { eventType, created };
  }

  return { eventType, created: false, reason: "unknown eventType" };
}

/**
 * Ingest an incoming email that arrived through the IMAP listener. This always
 * writes an IncomingEmailEvent AND mirrors it as an EmailEvent so it appears in
 * counts and the /emails view. Used by /reply-detected and /bounce-detected.
 */
export async function ingestIncoming(
  evt: IncomingEvent
): Promise<IngestResult> {
  // Reuse the EMAIL path which already mirrors into IncomingEmailEvent.
  return ingestEvent(evt);
}

// ---------------------------------------------------------------------------
// Batch ingestion
// ---------------------------------------------------------------------------

export async function ingestEvents(
  events: IncomingEvent[]
): Promise<{ total: number; created: number; results: IngestResult[] }> {
  const results: IngestResult[] = [];
  let createdCount = 0;
  for (const e of events) {
    try {
      const r = await ingestEvent(e);
      if (r.created) createdCount++;
      results.push(r);
    } catch (err) {
      results.push({
        eventType: clean(e.eventType) ?? "(none)",
        created: false,
        reason: err instanceof Error ? err.message : "error",
      });
    }
  }
  return { total: events.length, created: createdCount, results };
}

// ---------------------------------------------------------------------------
// Google Sheet row -> events
// ---------------------------------------------------------------------------

/**
 * Convert one normalized "Sent" sheet row into the discrete events it implies.
 * Mirrors the lifecycle in KlijentiTrazenjeAutomatizacija_v10_jezici.
 */
export function sheetRowToEvents(
  row: SheetRow,
  source = "google_sheets_sync"
): IncomingEvent[] {
  const email = lower(row.email);
  if (!email) return [];

  const companyName = clean(row.companyName) ?? clean(row.business_name);
  const country = clean(row.country);
  const city = clean(row.city);
  const niche = clean(row.niche);
  const website = clean(row.website);
  const subject = clean(row.subject);
  const status = lower(row.status);
  const tsSent =
    clean(row.timestamp_sent) ?? clean(row.follow_up_sent_at) ?? undefined;
  const fuSentAt = clean(row.follow_up_sent_at);
  const hasMessage = Boolean(clean(row.message_text) || subject);

  const base = {
    source,
    email,
    companyName,
    country,
    city,
    niche,
    website,
    metadata: row as Record<string, unknown>,
  };

  const events: IncomingEvent[] = [];

  // A row in the sheet always represents a discovered, contacted lead.
  events.push({
    ...base,
    eventType: "lead_found",
    sourceUrl: website,
    timestamp: tsSent,
  });

  if (hasMessage) {
    events.push({
      ...base,
      eventType: "email_generated",
      subject,
      timestamp: tsSent,
    });
  }

  // status "sent" or a send timestamp implies the email went out.
  if (status === "sent" || status === "followed_up" || clean(row.timestamp_sent)) {
    events.push({
      ...base,
      eventType: "email_sent",
      subject,
      status: "sent",
      timestamp: clean(row.timestamp_sent) ?? tsSent,
    });
  }

  if (status === "followed_up" || fuSentAt) {
    events.push({
      ...base,
      eventType: "followup_sent",
      subject: clean(row.follow_up_subject) ?? subject,
      status: "followed_up",
      timestamp: fuSentAt ?? tsSent,
    });
  }

  if (status === "replied" || status === "reply") {
    events.push({
      ...base,
      eventType: "reply_detected",
      subject,
      status: "replied",
      timestamp: tsSent,
    });
  }

  if (status === "bounced" || status === "bounce") {
    events.push({
      ...base,
      eventType: "bounce_detected",
      subject,
      status: "bounced",
      timestamp: tsSent,
    });
  }

  if (status === "failed") {
    events.push({
      ...base,
      eventType: "failed",
      subject,
      status: "failed",
      timestamp: tsSent,
    });
  }

  return events;
}
