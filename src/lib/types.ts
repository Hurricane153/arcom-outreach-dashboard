// Shared event types and the canonical list of dashboard event types.

export const EVENT_TYPES = [
  "workflow_started",
  "workflow_finished",
  "lead_found",
  "email_generated",
  "email_sent",
  "followup_sent",
  "reply_detected",
  "bounce_detected",
  "failed",
  "skipped_duplicate",
  "skipped_unsubscribed",
  "skipped_blacklisted",
  "synced_from_sheet",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Normalized event payload accepted by the ingestion engine. n8n workflows and
 * the generic /api/n8n/events endpoint all post variations of this shape; the
 * engine is tolerant of missing fields.
 */
export interface IncomingEvent {
  eventType: EventType | string;

  // Run correlation (optional)
  runId?: string;
  source?: string;
  workflowName?: string;
  rawBrief?: string;
  requestedCount?: number;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  stats?: Record<string, unknown>;

  // Lead / email fields
  email?: string;
  companyName?: string; // == business_name in the sheet
  website?: string;
  country?: string;
  city?: string;
  niche?: string;
  sourceUrl?: string;
  subject?: string;
  errorMessage?: string;

  // Incoming email fields
  fromName?: string;
  messageId?: string;
  threadId?: string;
  receivedAt?: string;
  snippet?: string;

  // A timestamp used both for DailyStats bucketing and for sheet dedupe keys.
  timestamp?: string;

  // Optional explicit idempotency key; otherwise one is derived.
  dedupeKey?: string;

  metadata?: Record<string, unknown>;
}

/** One normalized row coming from the Google Sheet sync workflow. */
export interface SheetRow {
  email?: string;
  companyName?: string;
  business_name?: string;
  website?: string;
  country?: string;
  city?: string;
  niche?: string;
  language?: string;
  subject?: string;
  message_text?: string;
  follow_up_subject?: string;
  follow_up_text?: string;
  status?: string;
  timestamp_sent?: string;
  follow_up_due_date?: string;
  follow_up_sent_at?: string;
  [key: string]: unknown;
}
