"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Config {
  enabled: boolean;
  leadsPerRun: number;
  intervalMinutes: number;
  brief: string | null;
  chatId: string | null;
}

function splitInterval(minutes: number): { value: number; unit: string } {
  if (minutes % 1440 === 0) return { value: minutes / 1440, unit: "days" };
  if (minutes % 60 === 0) return { value: minutes / 60, unit: "hours" };
  return { value: minutes, unit: "minutes" };
}

function toMinutes(value: number, unit: string): number {
  if (unit === "days") return value * 1440;
  if (unit === "hours") return value * 60;
  return value;
}

export default function AutopilotForm({ initial }: { initial: Config }) {
  const router = useRouter();
  const init = splitInterval(initial.intervalMinutes || 1440);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [leadsPerRun, setLeadsPerRun] = useState(initial.leadsPerRun || 10);
  const [intervalValue, setIntervalValue] = useState(init.value);
  const [intervalUnit, setIntervalUnit] = useState(init.unit);
  const [brief, setBrief] = useState(initial.brief ?? "");
  const [chatId, setChatId] = useState(initial.chatId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/control/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          leadsPerRun,
          intervalMinutes: toMinutes(intervalValue, intervalUnit),
          brief,
          chatId,
        }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3">
        <span className="relative inline-flex h-6 w-11 items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
        </span>
        <span className="text-sm font-medium text-slate-800">
          {enabled ? "Autopilot ON" : "Autopilot off"}
        </span>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Leads per run
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={leadsPerRun}
            onChange={(e) => setLeadsPerRun(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Run every
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={intervalValue}
              onChange={(e) => setIntervalValue(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <select
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Brief (optional)
          </label>
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. dental clinics in Germany"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Telegram chat ID (optional)
          </label>
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="optional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save autopilot settings"}
        </button>
        {saved ? (
          <span className="text-sm font-medium text-emerald-600">Saved ✓</span>
        ) : null}
      </div>

      <p className="text-xs text-slate-400">
        The dashboard fires a run every interval automatically while enabled. Minimum interval 15 minutes.
      </p>
    </div>
  );
}
