import { fmtDay } from "./ui";

interface DailyRow {
  date: string;
  emailsSent: number;
  followupsSent: number;
  repliesDetected: number;
}

// Lightweight dependency-free bar chart for emails sent per day.
export default function DailyChart({ data }: { data: DailyRow[] }) {
  const rows = [...data].reverse(); // oldest -> newest left to right
  const max = Math.max(1, ...rows.map((r) => r.emailsSent + r.followupsSent));

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No daily data yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-1 overflow-x-auto">
        {rows.map((r) => {
          const sentH = (r.emailsSent / max) * 100;
          const fuH = (r.followupsSent / max) * 100;
          return (
            <div
              key={r.date}
              className="flex min-w-[14px] flex-1 flex-col items-center justify-end"
              title={`${r.date}\nSent: ${r.emailsSent}\nFollow-ups: ${r.followupsSent}\nReplies: ${r.repliesDetected}`}
            >
              <div className="flex w-full flex-col justify-end">
                <div
                  className="w-full rounded-t bg-violet-400"
                  style={{ height: `${fuH}%` }}
                />
                <div
                  className="w-full bg-blue-500"
                  style={{ height: `${sentH}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>{fmtDay(rows[0]?.date)}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />
            Sent
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-violet-400" />
            Follow-ups
          </span>
        </div>
        <span>{fmtDay(rows[rows.length - 1]?.date)}</span>
      </div>
    </div>
  );
}
