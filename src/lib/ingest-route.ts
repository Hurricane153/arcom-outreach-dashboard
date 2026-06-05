import { NextResponse } from "next/server";
import { requireSecret } from "./auth";
import { ingestEvent, ingestEvents, sheetRowToEvents } from "./events";
import type { IncomingEvent, SheetRow } from "./types";

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Handle a single-event ingestion endpoint. If `forcedType` is given it
 * overrides whatever eventType the caller sent (used by the dedicated
 * /lead-found, /email-sent, ... routes).
 *
 * Also accepts an array under `events` for convenience.
 */
export async function ingestSingleRoute(
  req: Request,
  forcedType?: string
): Promise<NextResponse> {
  const unauthorized = requireSecret(req);
  if (unauthorized) return unauthorized;

  const body = await readJson(req);

  // Allow batch posting to any of these endpoints too.
  if (Array.isArray(body.events)) {
    const events = (body.events as IncomingEvent[]).map((e) =>
      forcedType ? { ...e, eventType: forcedType } : e
    );
    const summary = await ingestEvents(events);
    return NextResponse.json({ ok: true, ...summary });
  }

  const evt: IncomingEvent = { ...(body as unknown as IncomingEvent) };
  if (forcedType) evt.eventType = forcedType;

  try {
    const result = await ingestEvent(evt);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ingest failed" },
      { status: 500 }
    );
  }
}

/** Handle a sheet-sync endpoint that receives one or many rows. */
export async function ingestSheetRoute(req: Request): Promise<NextResponse> {
  const unauthorized = requireSecret(req);
  if (unauthorized) return unauthorized;

  const body = await readJson(req);
  const source =
    typeof body.source === "string" ? body.source : "google_sheets_sync";

  let rows: SheetRow[] = [];
  if (Array.isArray(body.rows)) rows = body.rows as SheetRow[];
  else if (body.row && typeof body.row === "object")
    rows = [body.row as SheetRow];
  else if (body.email) rows = [body as SheetRow]; // a bare row

  const events = rows.flatMap((r) => sheetRowToEvents(r, source));
  const summary = await ingestEvents(events);

  return NextResponse.json({
    ok: true,
    rowsReceived: rows.length,
    eventsDerived: events.length,
    ...summary,
  });
}
