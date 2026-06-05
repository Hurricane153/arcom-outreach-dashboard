// Minimal, correct CSV serialization (RFC 4180-ish).

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; header: string }[]
): string {
  const head = columns.map((c) => cell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => cell(r[c.key])).join(","))
    .join("\r\n");
  return head + "\r\n" + body + "\r\n";
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
