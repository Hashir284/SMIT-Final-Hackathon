import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Empty from "../components/ui/Empty";
import { TableSkeleton } from "../components/ui/Skeleton";

export default function Payroll() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [month]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/payroll?month=${month}`);
      setPayrolls(res.payrolls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function runPayroll() {
    setSaving(true);
    setMsg("");
    try {
      const res = await api.post("/payroll/run", { month });
      setMsg(res.message);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function finalize() {
    if (!confirm(`Finalize payroll for ${month}? This locks the month.`)) return;
    setSaving(true);
    try {
      const res = await api.post("/payroll/finalize", { month });
      setMsg(res.message);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function downloadPayslip(id) {
    setMsg("");
    try {
      const blob = await api.get(`/payroll/${id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monthly pay records. Total before deductions includes basic pay and allowances; take-home pay is after deductions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          {(user.role === "HR" || user.role === "Admin") && (
            <Button loading={saving} onClick={runPayroll}>Generate draft</Button>
          )}
          {user.role === "Admin" && (
            <Button variant="success" loading={saving} onClick={finalize}>Approve &amp; lock month</Button>
          )}
        </div>
      </div>

      {msg && <p className="text-sm text-teal-600 mb-4">{msg}</p>}

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {["Employee", "Total before deductions", "Present days", "Absent days", "Half days", "Tax", "Take-home pay", "Status", "Payslip"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium">{p.employee?.name}</td>
                    <td className="px-5 py-3">{p.gross?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-emerald-600">{p.presentDays}</td>
                    <td className="px-5 py-3 text-rose-600">{p.absentDays}</td>
                    <td className="px-5 py-3">{p.halfDays}</td>
                    <td className="px-5 py-3">{p.tax?.toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{p.netSalary?.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Badge status={p.status}>{p.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "finalized" && (
                        <Button size="sm" variant="ghost" onClick={() => downloadPayslip(p._id)}>
                          Download PDF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!payrolls.length && (
              <Empty title="No payroll for this month" description="HR can run a draft to generate records." />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
