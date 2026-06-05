"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches the page's server data (router.refresh) and shows a
// "live / updated Ns ago" indicator with an on/off toggle and manual refresh.
export default function AutoRefresh({
  intervalSeconds = 30,
}: {
  intervalSeconds?: number;
}) {
  const router = useRouter();
  const [on, setOn] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      router.refresh();
      setSecondsAgo(0);
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [on, intervalSeconds, router]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            on ? "animate-pulse bg-emerald-500" : "bg-slate-300"
          }`}
        />
        {on ? `updated ${secondsAgo}s ago` : "paused"}
      </span>
      <button
        onClick={() => {
          router.refresh();
          setSecondsAgo(0);
        }}
        className="rounded-md border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
        title="Refresh now"
      >
        Refresh
      </button>
      <button
        onClick={() => setOn((v) => !v)}
        className={`rounded-md px-2 py-1 font-medium ${
          on
            ? "bg-emerald-50 text-emerald-700"
            : "border border-slate-200 text-slate-500 hover:bg-slate-100"
        }`}
      >
        {on ? "Live" : "Off"}
      </button>
    </div>
  );
}
