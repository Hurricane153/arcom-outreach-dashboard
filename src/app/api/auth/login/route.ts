import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const USER = process.env.AUTH_USER;
  const PASS = process.env.AUTH_PASSWORD;
  const SECRET = process.env.AUTH_SESSION_SECRET;

  if (!USER || !PASS || !SECRET) {
    return NextResponse.json(
      { ok: false, error: "Login is not configured on the server." },
      { status: 500 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (email !== USER.trim().toLowerCase() || password !== PASS) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Secure cookie only when served over HTTPS (so it still works over http://IP:3001).
  const proto =
    req.headers.get("x-forwarded-proto") ??
    new URL(req.url).protocol.replace(":", "");
  const isHttps = proto === "https";

  const res = NextResponse.json({ ok: true });
  res.cookies.set("arcom_session", SECRET, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
