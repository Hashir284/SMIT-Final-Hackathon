import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Empty from "../components/ui/Empty";
import { TableSkeleton } from "../components/ui/Skeleton";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TABS = [
  { id: "company", label: "Company" },
  { id: "departments", label: "Departments" },
  { id: "leaveTypes", label: "Leave Types" },
  { id: "holidays", label: "Holidays" },
  { id: "hr", label: "HR Users" },
];

export default function Organization() {
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // forms / modals
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [editDept, setEditDept] = useState(null);
  const [ltForm, setLtForm] = useState({ name: "", code: "", yearlyQuota: 10, isPaid: true });
  const [editLt, setEditLt] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "" });
  const [hrForm, setHrForm] = useState({ name: "", email: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }
  const [temporaryPassword, setTemporaryPassword] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, d, lt, h, hr] = await Promise.all([
        api.get("/org/company"),
        api.get("/org/departments"),
        api.get("/org/leave-types"),
        api.get("/org/holidays"),
        api.get("/org/hr"),
      ]);
      setCompany(c.company);
      setDepartments(d.departments || []);
      setLeaveTypes(lt.leaveTypes || []);
      setHolidays(h.holidays || []);
      setHrs(hr.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveCompany(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/org/company", company);
      setCompany(res.company);
      setMsg("Company updated");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveDept(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDept) {
        await api.put(`/org/departments/${editDept._id}`, deptForm);
      } else {
        await api.post("/org/departments", deptForm);
      }
      setEditDept(null);
      setDeptForm({ name: "", description: "" });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveLt(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editLt) {
        await api.put(`/org/leave-types/${editLt._id}`, ltForm);
      } else {
        await api.post("/org/leave-types", ltForm);
      }
      setEditLt(null);
      setLtForm({ name: "", code: "", yearlyQuota: 10, isPaid: true });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addHoliday(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/org/holidays", holidayForm);
      setHolidayForm({ name: "", date: "" });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addHR(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/org/hr", hrForm);
      setHrForm({ name: "", email: "", password: "" });
      setMsg("HR account created");
      loadAll();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleHR(hr) {
    try {
      await api.patch(`/org/users/${hr._id}/toggle`);
      loadAll();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function resetHRPassword(hr) {
    try {
      const res = await api.post(`/org/users/${hr._id}/reset-password`);
      setTemporaryPassword(`${hr.name}: ${res.temporaryPassword}`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "department") {
        await api.delete(`/org/departments/${deleteTarget.id}`);
      } else if (deleteTarget.type === "holiday") {
        await api.delete(`/org/holidays/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      setMsg(err.message);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 skeleton" />
        <TableSkeleton rows={4} cols={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Organization Setup</h1>
        <p className="text-sm text-slate-500 mt-0.5">Company rules, departments, leave types & HR users</p>
      </div>

      {msg && <p className="text-sm text-teal-600 mb-4">{msg}</p>}

      <div className="flex flex-wrap gap-1 mb-5 p-1 bg-slate-100 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && company && (
        <Card>
          <form onSubmit={saveCompany} className="space-y-4 max-w-2xl">
            <Field label="Company Name">
              <input className="field" value={company.name || ""} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Office Start">
                <input type="time" className="field" value={company.officeStartTime || "09:00"} onChange={(e) => setCompany({ ...company, officeStartTime: e.target.value })} />
              </Field>
              <Field label="Office End">
                <input type="time" className="field" value={company.officeEndTime || "18:00"} onChange={(e) => setCompany({ ...company, officeEndTime: e.target.value })} />
              </Field>
              <Field label="Grace period (minutes)">
                <input type="number" min="0" className="field" value={company.graceMinutes ?? 15} onChange={(e) => setCompany({ ...company, graceMinutes: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Office address">
              <input className="field" value={company.officeAddress || ""} onChange={(e) => setCompany({ ...company, officeAddress: e.target.value })} />
            </Field>
            <Field label="Weekend days">
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={(company.weekendDays || []).includes(day.value)}
                      onChange={(e) => {
                        const days = company.weekendDays || [];
                        setCompany({
                          ...company,
                          weekendDays: e.target.checked
                            ? [...days, day.value].sort()
                            : days.filter((value) => value !== day.value),
                        });
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Office latitude">
                <input type="number" step="any" className="field" value={company.officeLatitude || ""} onChange={(e) => setCompany({ ...company, officeLatitude: Number(e.target.value) })} />
              </Field>
              <Field label="Office longitude">
                <input type="number" step="any" className="field" value={company.officeLongitude || ""} onChange={(e) => setCompany({ ...company, officeLongitude: Number(e.target.value) })} />
              </Field>
              <Field label="Attendance radius (meters)">
                <input type="number" min="1" className="field" value={company.officeRadius ?? 150} onChange={(e) => setCompany({ ...company, officeRadius: Number(e.target.value) })} />
              </Field>
            </div>
            <Button type="submit" loading={saving}>Save Company</Button>
          </form>
        </Card>
      )}

      {tab === "departments" && (
        <div className="space-y-4">
          <Card title={editDept ? "Edit Department" : "Add Department"}>
            <form onSubmit={saveDept} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input required className="field" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <input className="field" value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
              </div>
              <Button type="submit" loading={saving}>{editDept ? "Update" : "Add"}</Button>
              {editDept && (
                <Button type="button" variant="secondary" onClick={() => { setEditDept(null); setDeptForm({ name: "", description: "" }); }}>Cancel</Button>
              )}
            </form>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium">{d.name}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditDept(d); setDeptForm({ name: d.name, description: d.description || "" }); }}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget({ type: "department", id: d._id, name: d.name })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!departments.length && <Empty title="No departments" />}
          </Card>
        </div>
      )}

      {tab === "leaveTypes" && (
        <div className="space-y-4">
          <Card title={editLt ? "Edit Leave Type" : "Add Leave Type"}>
            <form onSubmit={saveLt} className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input required className="field w-36" value={ltForm.name} onChange={(e) => setLtForm({ ...ltForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Code</label>
                <input required className="field w-28" value={ltForm.code} onChange={(e) => setLtForm({ ...ltForm, code: e.target.value })} disabled={!!editLt} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Quota</label>
                <input type="number" className="field w-20" value={ltForm.yearlyQuota} onChange={(e) => setLtForm({ ...ltForm, yearlyQuota: Number(e.target.value) })} />
              </div>
              <Button type="submit" loading={saving}>{editLt ? "Update" : "Add"}</Button>
              {editLt && <Button type="button" variant="secondary" onClick={() => { setEditLt(null); setLtForm({ name: "", code: "", yearlyQuota: 10, isPaid: true }); }}>Cancel</Button>}
            </form>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {["Name", "Code", "Quota", "Paid", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaveTypes.map((t) => (
                  <tr key={t._id}>
                    <td className="px-5 py-3 font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-slate-500">{t.code}</td>
                    <td className="px-5 py-3">{t.yearlyQuota}</td>
                    <td className="px-5 py-3">{t.isPaid ? "Yes" : "No"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditLt(t); setLtForm({ name: t.name, code: t.code, yearlyQuota: t.yearlyQuota, isPaid: t.isPaid }); }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leaveTypes.length && <Empty title="No leave types" />}
          </Card>
        </div>
      )}

      {tab === "holidays" && (
        <div className="space-y-4">
          <Card title="Add Holiday">
            <form onSubmit={addHoliday} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input required className="field" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Date</label>
                <input type="date" required className="field" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
              </div>
              <Button type="submit" loading={saving}>Add</Button>
            </form>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {holidays.map((h) => (
                  <tr key={h._id}>
                    <td className="px-5 py-3 font-medium">{h.name}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(h.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget({ type: "holiday", id: h._id, name: h.name })}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!holidays.length && <Empty title="No holidays" />}
          </Card>
        </div>
      )}

      {tab === "hr" && (
        <div className="space-y-4">
          <Card title="Create HR User">
            <form onSubmit={addHR} className="grid sm:grid-cols-3 gap-3 items-end">
              <Field label="Name"><input required className="field" value={hrForm.name} onChange={(e) => setHrForm({ ...hrForm, name: e.target.value })} /></Field>
              <Field label="Email"><input type="email" required className="field" value={hrForm.email} onChange={(e) => setHrForm({ ...hrForm, email: e.target.value })} /></Field>
              <Field label="Temp Password"><input type="password" required minLength={6} className="field" value={hrForm.password} onChange={(e) => setHrForm({ ...hrForm, password: e.target.value })} /></Field>
              <Button type="submit" loading={saving} className="sm:col-span-3 w-fit">Create HR</Button>
            </form>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase">Active</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hrs.map((h) => (
                  <tr key={h._id}>
                    <td className="px-5 py-3 font-medium">{h.name}</td>
                    <td className="px-5 py-3 text-slate-500">{h.email}</td>
                    <td className="px-5 py-3">{h.isActive ? "Yes" : "No"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => resetHRPassword(h)}>Reset login</Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => toggleHR(h)}>
                        {h.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!hrs.length && <Empty title="No HR users yet" />}
          </Card>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={saving} onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal
        open={!!temporaryPassword}
        onClose={() => setTemporaryPassword("")}
        title="Temporary login password"
        size="sm"
      >
        <p className="mb-3 text-sm text-slate-600">
          Share this password securely. The HR user must change it after signing in.
        </p>
        <code className="block break-all rounded bg-slate-100 p-3 text-sm">{temporaryPassword}</code>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setTemporaryPassword("")}>Done</Button>
        </div>
      </Modal>

      <style>{`
        .field { width:100%; border-radius:0.5rem; border:1px solid #e2e8f0; padding:0.5rem 0.75rem; font-size:0.875rem; outline:none; background:white; }
        .field:focus { border-color:#14b8a6; box-shadow:0 0 0 3px rgba(20,184,166,0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
