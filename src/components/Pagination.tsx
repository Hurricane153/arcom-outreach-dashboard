import Link from "next/link";

// Server-rendered pager. Builds prev/next links preserving current filters.
export default function Pagination({
  basePath,
  query,
  page,
  totalPages,
  total,
  pageSize,
}: {
  basePath: string;
  query: Record<string, string>;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v && v.trim() !== "" && k !== "page") params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
      <div>
        Showing <span className="font-medium text-slate-700">{from}</span>–
        <span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-100"
          >
            ← Prev
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-slate-100 px-3 py-1 text-slate-300">
            ← Prev
          </span>
        )}
        <span className="px-2 text-xs">
          Page {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-100"
          >
            Next →
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-slate-100 px-3 py-1 text-slate-300">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
