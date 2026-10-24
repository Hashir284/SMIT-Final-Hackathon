import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { TableSkeleton } from "../components/ui/Skeleton";
import Empty from "../components/ui/Empty";

export default function Attendance() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [correctionNote, setCorrectionNote] = useState("");
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ checkIn: "", checkOut: "", status: "present" });
  const [showCorrections, setShowCorrections] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load(correctionMode = showCorrections) {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([
        user.role === "Employee"
          ? api.get("/attendance/my-today")
          : Promise.resolve({ attendance: null }),
        api.get(user.role === "Employee"
          ? `/attendance?from=${fromDate}&to=${toDate}`
          : correctionMode
            ? "/attendance?correctionStatus=pending"
            : "/attendance"),
      ]);
      setToday(t.attendance);
      setRecords(b.records || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function doCheckIn() {
    setMsg("");
    setActionLoading(true);
    try {
      const res = await api.post("/attendance/check-in", {});
      setMsg(res.message);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function doCheckOut() {
    setMsg("");
    setActionLoading(true);
    try {
      const res = await api.post("/attendance/check-out", {});
      setMsg(res.message);
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function requestCorrection(e) {
    e.preventDefault();
    setActionLoading(true);
    setMsg("");
    try {
      const res = await api.post("/attendance/correction", {
        dateStr: correctionDate,
        note: correctionNote,
      });
      setMsg(res.message);
      setCorrectionNote("");
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function openCorrectionReview(record) {
    const toTime = (value) =>
      value ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
    setCorrectionTarget(record);
    setReviewForm({
      checkIn: toTime(record.checkIn),
      checkOut: toTime(record.checkOut),
      status: record.status || "present",
    });
  }

  async function reviewCorrection(e, status) {
    e.preventDefault();
    setActionLoading(true);
    setMsg("");
    try {
      const payload = { status };
      if (status === "approved") {
        payload.newStatus = reviewForm.status;
        if (reviewForm.checkIn) {
          payload.checkIn = new Date(`${correctionTarget.dateStr}T${reviewForm.checkIn}`).toISOString();
        }
        if (reviewForm.checkOut) {
          payload.checkOut = new Date(`${correctionTarget.dateStr}T${reviewForm.checkOut}`).toISOString();
        }
      }
      await api.put(`/attendance/correction/${correctionTarget._id}`, payload);
      setCorrectionTarget(null);
      setMsg("Attendance correction reviewed.");
      load();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {user.role === "Employee" ? "Check in/out and view your attendance history" : "Review the team attendance board"}
        </p>
        {["HR", "Admin"].includes(user.role) && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              const next = !showCorrections;
              setShowCorrections(next);
              load(next);
            }}
          >
            {showCorrections ? "Show today's attendance" : "Review pending corrections"}
          </Button>
        )}
      </div>

      {user.role === "Employee" && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">
                Today · {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge status={today?.status || "absent"}>
                  {today?.status || "Not checked in"}
                </Badge>
                {today?.checkIn && (
                  <span className="text-xs text-slate-500">
                    In: {new Date(today.checkIn).toLocaleTimeString()}
                  </span>
                )}
                {today?.checkOut && (
                  <span className="text-xs text-slate-500">
                    Out: {new Date(today.checkOut).toLocaleTimeString()}
                  </span>
                )}
              </div>
              {msg && <p className="text-sm text-teal-600 mt-2">{msg}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="success"
                loading={actionLoading}
                disabled={!!today?.checkIn}
                onClick={doCheckIn}
              >
                Check In
              </Button>
              <Button
                loading={actionLoading}
                disabled={!today?.checkIn || !!today?.checkOut}
                onClick={doCheckOut}
              >
                Check Out
              </Button>
            </div>
          </div>
        </Card>
      )}

      {user.role === "Employee" && (
        <Card title="Request an attendance correction" className="mb-6">
          <form onSubmit={requestCorrection} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm text-slate-600">
              Date
              <input
                required
                type="date"
                className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={correctionDate}
                onChange={(e) => setCorrectionDate(e.target.value)}
              />
            </label>
            <label className="flex-1 text-sm text-slate-600">
              Reason
              <input
                required
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Explain what needs correcting"
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
              />
            </label>
            <Button type="submit" loading={actionLoading}>Send request</Button>
          </form>
          {msg && <p className="mt-3 text-sm text-teal-700">{msg}</p>}
        </Card>
      )}

      {user.role === "Employee" && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-600">
            From
            <input type="date" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            To
            <input type="date" className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <Button variant="secondary" onClick={load}>Show dates</Button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <Card title={user.role === "Employee" ? "My Attendance" : showCorrections ? "Pending attendance corrections" : "Attendance Board (Today)"} className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {(user.role === "Employee"
                    ? ["Date", "Status", "Check In", "Check Out", "Late", "Hours"]
                    : ["Employee", "Status", "Check In", "Check Out", "Late", "Hours", "Correction request", "Review"]).map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                  {user.role === "Employee" && (
                    <>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Correction request</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Review</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {user.role === "Employee" ? r.dateStr : r.employee?.name || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={r.status}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-amber-600">{r.lateMinutes || 0}</td>
                    <td className="px-5 py-3">{r.workedHours || 0}</td>
                    {user.role === "Employee" ? (
                      <>
                        <td className="px-5 py-3 text-slate-600">{r.correctionRequest || "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{r.correctionStatus === "none" ? "—" : r.correctionStatus}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 text-slate-600">{r.correctionRequest || "—"}</td>
                        <td className="px-5 py-3 text-right">
                          {r.correctionStatus === "pending" && (
                            <Button size="sm" variant="secondary" onClick={() => openCorrectionReview(r)}>
                              Review
                            </Button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!records.length && <Empty title={showCorrections ? "No pending corrections" : "No attendance records"} />}
          </div>
        </Card>
      )}

      <Modal
        open={!!correctionTarget}
        onClose={() => setCorrectionTarget(null)}
        title="Review attendance correction"
        size="sm"
      >
        <form className="space-y-4" onSubmit={(e) => reviewCorrection(e, "approved")}>
          <p className="text-sm text-slate-600">
            {correctionTarget?.employee?.name} · {correctionTarget?.dateStr}
            <br />
            Reason: {correctionTarget?.correctionRequest}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600">
              Check in
              <input type="time" className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" value={reviewForm.checkIn} onChange={(e) => setReviewForm({ ...reviewForm, checkIn: e.target.value })} />
            </label>
            <label className="text-sm text-slate-600">
              Check out
              <input type="time" className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" value={reviewForm.checkOut} onChange={(e) => setReviewForm({ ...reviewForm, checkOut: e.target.value })} />
            </label>
          </div>
          <label className="block text-sm text-slate-600">
            Attendance status
            <select className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
              {["present", "late", "half", "absent", "on_leave"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCorrectionTarget(null)}>Cancel</Button>
            <Button type="button" variant="danger" loading={actionLoading} onClick={(e) => reviewCorrection(e, "rejected")}>Reject</Button>
            <Button type="submit" variant="success" loading={actionLoading}>Approve</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
