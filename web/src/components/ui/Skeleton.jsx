/** Simple skeleton blocks for loading states */
export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

/** Stats row skeleton (dashboard KPI cards) */
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-14 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-4 border-b border-slate-50 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-32" : "w-16"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card content skeleton */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
