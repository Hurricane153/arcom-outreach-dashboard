"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunForm() {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [brief, setBrief] = useState("");
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    if (
      !confirm(
        `Start an outreach run for ${count} lead(s)? This will search, write, and SEND real emails.`
      )
    )
      return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/control/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, brief, chatId }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg({
        ok: res.ok && data.ok,
        text:
          res.ok && data.ok
            ? `Run started for ${count} leads. Results will appear as the workflow finishes (a few minutes).`
            : data.message || "Failed to start run.",
      });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Number of leads
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Brief (optional) — niche / location
          </label>
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. hotels in Berlin (leave blank for auto mix)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Telegram chat ID (optional — to also get the summary in Telegram)
        </label>
        <input
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="optional"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Starting…" : `▶ Run ${count} leads now`}
      </button>

      {msg ? (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
