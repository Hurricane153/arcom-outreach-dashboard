interface Step {
  label: string;
  value: number;
  color: string;
}

// Horizontal conversion funnel. Each bar is scaled to the first (largest) step,
// and shows the conversion % relative to the top of the funnel.
export default function Funnel({ steps }: { steps: Step[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);

  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const widthPct = Math.max((s.value / top) * 100, 2);
        const convPct = top > 0 ? Math.round((s.value / top) * 100) : 0;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="text-slate-500">
                <span className="font-semibold text-slate-900">{s.value.toLocaleString()}</span>
                {i > 0 ? <span className="ml-1 text-slate-400">({convPct}%)</span> : null}
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100">
              <div
                className={`flex h-full items-center justify-end rounded-md ${s.color} px-2 text-[10px] font-semibold text-white transition-all`}
                style={{ width: `${widthPct}%` }}
              >
                {widthPct > 12 ? s.value.toLocaleString() : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
