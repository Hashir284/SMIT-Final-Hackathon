import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Empty from "../components/ui/Empty";
import { TableSkeleton, StatsSkeleton } from "../components/ui/Skeleton";

export default function Leaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [smartText, setSmartText] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [l, t] = await Promise.all([
        api.get("/leaves"),
        api.get("/org/leave-types"),
      ]);
      setLeaves(l.leaves || []);
      setLeaveTypes(t.leaveTypes || []);
      if (user.role === "Employee") {
        const b = await api.get("/leaves/balance");
        setBalance(b.balances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function apply(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api.post("/leaves", form);
      setShowForm(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      setMsg("Leave applied successfully");
      loadAll();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function review(id, status) {
    if (!reviewComment.trim()) {
      setMsg("Please add a comment before reviewing this request.");
      return;
    }
    try {
      await api.put(`/leaves/${id}/review`, { status, comment: reviewComment.trim() });
      setReviewTarget(null);
      setReviewComment("");
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function cancelLeave(id) {
    try {
      await api.put(`/leaves/${id}/cancel`);
      loadAll();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function smartLeave() {
    if (!smartText.trim()) return;
    setMsg("Parsing with AI...");
    setSaving(true);
    try {
      const res = await api.post("/ai/chat", {
        message: `Parse this leave request into leave type (casual/sick/annual), start date, end date and reason. Reply ONLY with JSON like {"type":"casual","start":"2026-10-25","end":"2026-10-26","reason":"..."}. Text: ${smartText}`,
      });
      const match = res.answer.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const code = (parsed.type || "casual").toLowerCase();
        const lt = leaveTypes.find((t) => t.code === code) || leaveTypes[0];
        setForm({
          leaveTypeId: lt?._id || "",
          startDate: parsed.start || "",
          endDate: parsed.end || "",
          reason: parsed.reason || smartText,
        });
        setShowForm(true);
        setMsg("Form pre-filled. Please confirm.");
      } else {
        setShowForm(true);
        setForm({ ...form, reason: smartText });
        setMsg("Could not parse fully. Fill manually.");
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 skeleton" />
        <StatsSkeleton count={3} />
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Apply, track and approve leaves</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Apply Leave</Button>
      </div>

      {user.role === "Employee" && (
        <Card title="Smart Leave (AI)" className="mb-5">
          <p className="text-xs text-slate-500 mb-3">
            Type in plain words — e.g. "I need Monday and Tuesday off for a wedding"
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              placeholder="Need next Monday off..."
            />
            <Button loading={saving} onClick={smartLeave}>Parse</Button>
          </div>
        </Card>
      )}

      {user.role === "Employee" && balance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {balance.map((b, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="text-xs text-slate-500">{b.leaveType.name}</div>
              <div className="text-2xl font-bold text-teal-600 mt-1">{b.remaining}</div>
              <div className="text-xs text-slate-400">of {b.quota} left</div>
            </div>
          ))}
        </div>
      )}

      {msg && !showForm && (
        <p className="text-sm text-teal-600 mb-4">{msg}</p>
      )}

      <Card title="Leave Requests" className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["Employee", "Type", "From", "To", "Days", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
                {(user.role === "HR" || user.role === "Admin" || user.role === "Employee") && (
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaves.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium">{l.employee?.name}</td>
                  <td className="px-5 py-3">{l.leaveType?.name}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(l.startDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate-600">{new Date(l.endDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{l.days}</td>
                  <td className="px-5 py-3"><Badge status={l.status}>{l.status}</Badge></td>
                  {(user.role === "HR" || user.role === "Admin" || user.role === "Employee") && (
                    <td className="px-5 py-3 text-right">
                      {["HR", "Admin"].includes(user.role) && l.status === "pending" && (
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="success" onClick={() => { setReviewTarget({ ...l, decision: "approved" }); setReviewComment(""); }}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => { setReviewTarget({ ...l, decision: "rejected" }); setReviewComment(""); }}>Reject</Button>
                        </div>
                      )}
                      {user.role === "Employee" && l.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => cancelLeave(l._id)}>Cancel request</Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!leaves.length && <Empty title="No leave requests" />}
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Apply for Leave">
        {msg && <p className="text-sm text-teal-600 mb-3">{msg}</p>}
        <form onSubmit={apply} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Leave Type *</label>
            <select required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>
              <option value="">— Select —</option>
              {leaveTypes.map((t) => (
                <option key={t._id} value={t._id}>{t.name} (quota: {t.yearlyQuota})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Start *</label>
              <input type="date" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">End *</label>
              <input type="date" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Reason</label>
            <textarea rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={`${reviewTarget?.decision === "approved" ? "Approve" : "Reject"} leave request`}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            review(reviewTarget._id, reviewTarget.decision);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-600">
            Add a short comment for {reviewTarget?.employee?.name || "the employee"}.
          </p>
          <textarea
            required
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button type="submit" variant={reviewTarget?.decision === "approved" ? "success" : "danger"}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
