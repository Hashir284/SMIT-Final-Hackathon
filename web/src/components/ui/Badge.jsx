const styles = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  late: "bg-amber-50 text-amber-700 ring-amber-600/20",
  absent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  on_leave: "bg-violet-50 text-violet-700 ring-violet-600/20",
  half: "bg-orange-50 text-orange-700 ring-orange-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  finalized: "bg-teal-50 text-teal-700 ring-teal-600/20",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-500 ring-slate-500/20",
  Admin: "bg-blue-50 text-blue-700 ring-blue-600/20",
  HR: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Employee: "bg-teal-50 text-teal-700 ring-teal-600/20",
};

export default function Badge({ status, children, className = "" }) {
  const key = status || children;
  const s = styles[key] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s} ${className}`}
    >
      {children || status}
    </span>
  );
}
