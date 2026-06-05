interface BarItem {
  label: string;
  count: number;
}

// Compact ranked horizontal bar list (top countries, top niches, ...).
export default function BarList({
  items,
  color = "bg-blue-500",
  emptyLabel = "No data yet.",
}: {
  items: BarItem[];
  color?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));

  if (items.length === 0) {
    return <div className="py-6 text-center text-sm text-slate-400">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <div className="w-24 shrink-0 truncate text-xs text-slate-600" title={it.label}>
            {it.label}
          </div>
          <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-100">
            <div
              className={`h-full rounded ${color}`}
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 shrink-0 text-right text-xs font-semibold text-slate-700">
            {it.count}
          </div>
        </div>
      ))}
    </div>
  );
}
