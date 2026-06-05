/**
 * Seed the dashboard with a small amount of realistic demo data so the UI is
 * populated before any n8n data flows in. Safe to run multiple times — events
 * are deduped by stable keys.
 *
 *   npm run db:seed
 */
import { ingestEvents, sheetRowToEvents } from "../src/lib/events";
import type { IncomingEvent } from "../src/lib/types";
import { prisma } from "../src/lib/prisma";

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

async function main() {
  // --- a "run" with start/finish -----------------------------------------
  const runId = "demo-run-001";
  const runEvents: IncomingEvent[] = [
    {
      eventType: "workflow_started",
      runId,
      source: "telegram_1",
      workflowName: "KlijentiTrazenjeAutomatizacija_v10_jezici",
      rawBrief: "10 dental clinics in Munich",
      requestedCount: 10,
      startedAt: isoDaysAgo(2, 9),
    },
  ];

  // sample sheet rows (mirrors the real "Sent" sheet columns)
  const rows = [
    {
      timestamp_sent: isoDaysAgo(2, 9),
      email: "praxis@zahnarzt-muenchen.de",
      business_name: "Zahnarztpraxis München",
      country: "DE",
      niche: "dental clinic",
      language: "de",
      subject: "Kurze Idee zur Automatisierung",
      message_text: "Guten Tag, ...",
      follow_up_subject: "Re: Kurze Idee zur Automatisierung",
      follow_up_text: "Guten Tag, ...",
      follow_up_due_date: isoDaysAgo(-3, 9),
      follow_up_sent_at: "",
      status: "sent",
    },
    {
      timestamp_sent: isoDaysAgo(2, 10),
      email: "info@dentista-milano.it",
      business_name: "Studio Dentistico Milano",
      country: "IT",
      niche: "dental clinic",
      language: "it",
      subject: "Una idea pratica",
      message_text: "Buongiorno, ...",
      follow_up_subject: "Re: Una idea pratica",
      follow_up_text: "Buongiorno, ...",
      follow_up_sent_at: isoDaysAgo(0, 9),
      status: "followed_up",
    },
    {
      timestamp_sent: isoDaysAgo(1, 12),
      email: "kontakt@beispiel-hotel.at",
      business_name: "Beispiel Hotel Wien",
      country: "AT",
      niche: "hotel",
      language: "de",
      subject: "Automatisierung für Gästeanfragen",
      message_text: "Guten Tag, ...",
      status: "replied",
    },
    {
      timestamp_sent: isoDaysAgo(1, 14),
      email: "office@broken-domain-xyz.com",
      business_name: "Broken Domain Ltd",
      country: "US",
      niche: "law firm",
      language: "en",
      subject: "A practical automation idea",
      message_text: "Hi, ...",
      status: "bounced",
    },
  ];

  const sheetEvents = rows.flatMap((r) => sheetRowToEvents(r, "google_sheets_sync"));

  // attach the first two rows to the demo run for the run-detail view
  for (const e of sheetEvents) {
    if (
      e.email === "praxis@zahnarzt-muenchen.de" ||
      e.email === "info@dentista-milano.it"
    ) {
      e.runId = runId;
    }
  }

  const finishEvent: IncomingEvent = {
    eventType: "workflow_finished",
    runId,
    status: "finished",
    finishedAt: isoDaysAgo(2, 10),
    stats: { requested: 10, verified: 8, sent: 8 },
  };

  // --- incoming reply + bounce via the listener path ----------------------
  const incoming: IncomingEvent[] = [
    {
      eventType: "reply_detected",
      email: "kontakt@beispiel-hotel.at",
      fromName: "Hotel Wien Rezeption",
      subject: "Re: Automatisierung für Gästeanfragen",
      messageId: "<demo-reply-1@mail>",
      receivedAt: isoDaysAgo(0, 11),
      snippet: "Vielen Dank, das klingt interessant. Können Sie mehr Details senden?",
    },
    {
      eventType: "bounce_detected",
      email: "office@broken-domain-xyz.com",
      fromName: "Mail Delivery System",
      subject: "Undelivered Mail Returned to Sender",
      messageId: "<demo-bounce-1@mail>",
      receivedAt: isoDaysAgo(1, 15),
      snippet: "550 5.1.1 The email account that you tried to reach does not exist.",
    },
  ];

  const summary = await ingestEvents([
    ...runEvents,
    ...sheetEvents,
    finishEvent,
    ...incoming,
  ]);

  console.log("Seed complete:", summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
