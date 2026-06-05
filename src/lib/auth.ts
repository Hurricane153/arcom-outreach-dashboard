import { NextResponse } from "next/server";

/**
 * Validate the shared-secret header on every n8n -> dashboard request.
 *
 * Returns null when the request is authorized, or a 401 NextResponse when it
 * is not. Usage in a route handler:
 *
 *   const unauthorized = requireSecret(req);
 *   if (unauthorized) return unauthorized;
 */
export function requireSecret(req: Request): NextResponse | null {
  const expected = process.env.N8N_DASHBOARD_SECRET;

  // If no secret is configured the dashboard refuses all ingestion to avoid
  // accidentally running wide open.
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server missing N8N_DASHBOARD_SECRET" },
      { status: 500 }
    );
  }

  const provided =
    req.headers.get("x-n8n-secret") ?? req.headers.get("X-N8N-Secret");

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: missing or invalid X-N8N-Secret" },
      { status: 401 }
    );
  }

  return null;
}
