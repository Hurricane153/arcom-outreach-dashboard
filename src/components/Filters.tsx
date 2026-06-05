"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface SelectDef {
  name: string;
  label: string;
  value: string;
  options: string[];
}

interface FiltersProps {
  basePath: string;
  /** Current query params (so unrelated ones are preserved). */
  query: Record<string, string>;
  q: string;
  searchPlaceholder?: string;
  selects?: SelectDef[];
  exportHref?: string;
}

// Search + dropdown filters that drive the page via URL query params.
// Avoids useSearchParams (so no Suspense boundary needed) by receiving the
// current query object as a prop.
export default function Filters({
  basePath,
  query,
  q,
  searchPlaceholder = "Search…",
  selects = [],
  exportHref,
}: FiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const firstRender = useRef(true);

  function pushWith(next: Record<string, string>) {
    const merged: Record<string, string> = { ...query, ...next, page: "1" };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v.trim() !== "") params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  // Debounce the search box.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => pushWith({ q: search }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasActive =
    !!q || selects.some((s) => s.value) ;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
      </div>

      {selects.map((s) => (
        <select
          key={s.name}
          value={s.value}
          onChange={(e) => pushWith({ [s.name]: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand"
        >
          <option value="">{s.label}: all</option>
          {s.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ))}

      {hasActive ? (
        <button
          onClick={() => {
            setSearch("");
            router.push(basePath);
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
        >
          Clear
        </button>
      ) : null}

      {exportHref ? (
        <a
          href={exportHref}
          className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ⬇ Export CSV
        </a>
      ) : null}
    </div>
  );
}
