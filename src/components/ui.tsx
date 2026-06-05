import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent = "slate",
  hint,
}: {
  label: string;
  value: number | string;
  accent?: "slate" | "blue" | "green" | "amber" | "red" | "violet";
  hint?: string;
}) {
  const accents: Record<string, string> = {
    slate: "text-slate-900",
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    violet: "text-violet-600",
  };
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${accents[accent]}`}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

const BADGES: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  email_sent: "bg-blue-100 text-blue-700",
  email_generated: "bg-slate-100 text-slate-700",
  lead_found: "bg-indigo-100 text-indigo-700",
  followed_up: "bg-violet-100 text-violet-700",
  followup_sent: "bg-violet-100 text-violet-700",
  replied: "bg-emerald-100 text-emerald-700",
  reply_detected: "bg-emerald-100 text-emerald-700",
  bounced: "bg-red-100 text-red-700",
  bounce_detected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  running: "bg-amber-100 text-amber-700",
  finished: "bg-emerald-100 text-emerald-700",
  active: "bg-emerald-100 text-emerald-700",
  stale: "bg-amber-100 text-amber-700",
  idle: "bg-slate-100 text-slate-600",
};

export function Badge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const cls = BADGES[value] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {value}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="table-scroll overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          {head}
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2 font-medium">{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 align-top text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

export function fmtDate(v?: string | Date | null): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDay(v?: string | Date | null): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}
