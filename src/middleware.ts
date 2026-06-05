import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that never require a login:
//  - /login                : the login page itself
//  - /api/auth/*           : login / logout endpoints
//  - /api/n8n/*            : n8n ingestion (protected by the X-N8N-Secret header)
const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/n8n"];

const COOKIE = "arcom_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // If auth isn't configured, leave the dashboard open (back-compat).
  const sessionSecret = process.env.AUTH_SESSION_SECRET;
  if (!sessionSecret) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === sessionSecret) return NextResponse.next();

  // Not authenticated.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
