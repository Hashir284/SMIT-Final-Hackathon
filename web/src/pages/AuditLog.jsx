import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/ui/Card";
import Empty from "../components/ui/Empty";
import { TableSkeleton } from "../components/ui/Skeleton";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/comms/audit?limit=100")
      .then((r) => setLogs(r.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track important system actions</p>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {["Time", "Actor", "Action", "Entity", "ID"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium">{l.actor?.name} <span className="text-xs text-slate-400">({l.actor?.role})</span></td>
                    <td className="px-5 py-3">{l.action}</td>
                    <td className="px-5 py-3 text-slate-600">{l.entity}</td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{l.entityId?.slice(-6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logs.length && <Empty title="No audit entries yet" />}
          </div>
        </Card>
      )}
    </div>
  );
}
