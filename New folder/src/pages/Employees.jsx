import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Empty from "../components/ui/Empty";
import { TableSkeleton } from "../components/ui/Skeleton";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  department: "",
  designation: "",
  workDays: [1, 2, 3, 4, 5],
  basicSalary: "",
  allowances: "",
  phone: "",
  address: "",
  isActive: true,
};

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [defaultWorkDays, setDefaultWorkDays] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    load();
    api.get("/org/departments")
      .then((r) => setDepartments(r.departments || []))
      .catch((err) => console.error(err));
    api.get("/org/company").then(({ company }) => {
      if (company?.weekendDays) {
        const workingDays = WEEKDAYS
          .map(({ value }) => value)
          .filter((day) => !company.weekendDays.includes(day));
        setDefaultWorkDays(workingDays.length ? workingDays : [1, 2, 3, 4, 5]);
      }
    }).catch((err) => console.error(err));
  }, []);

  async function load(q = search) {
    setLoading(true);
    try {
      const res = await api.get(`/employees?search=${encodeURIComponent(q || "")}`);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...emptyForm, workDays: defaultWorkDays });
    setEditId(null);
    setError("");
    setModal("create");
  }

  function openEdit(emp) {
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      department: emp.department?._id || emp.department || "",
      designation: emp.designation || "",
      workDays: emp.workDays?.length ? emp.workDays : defaultWorkDays,
      basicSalary: emp.basicSalary ?? "",
      allowances: emp.allowances ?? "",
      phone: emp.phone || "",
      address: emp.address || "",
      isActive: emp.isActive !== false,
    });
    setEditId(emp._id);
    setError("");
    setModal("edit");
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = user.role === "Employee"
        ? { phone: form.phone, address: form.address }
        : {
            name: form.name,
            department: form.department || undefined,
            designation: form.designation,
            basicSalary: Number(form.basicSalary) || 0,
            allowances: Number(form.allowances) || 0,
            workDays: form.workDays,
            phone: form.phone,
            address: form.address,
          };

      if (modal === "create") {
        await api.post("/employees", {
          ...payload,
          email: form.email,
          password: form.password,
        });
      } else {
        await api.put(`/employees/${editId}`, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    try {
      // Soft delete = deactivate
      await api.patch(`/employees/${deleteId}/toggle`);
      setDeleteId(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(employee) {
    try {
      const res = await api.post(`/org/users/${employee._id}/reset-password`);
      setTemporaryPassword(`${employee.name}: ${res.temporaryPassword}`);
    } catch (err) {
      setError(err.message);
    }
  }

  const canManage = user.role === "HR" || user.role === "Admin";
  const isEmployee = user.role === "Employee";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{isEmployee ? "My Profile" : "Employees"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEmployee ? "View your profile and update your phone number or address." : "Manage team members, salaries and status"}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>+ Register Employee</Button>
        )}
      </div>

      {/* Search */}
      {!isEmployee && <div className="flex gap-2 mb-5">
        <input
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <Button variant="secondary" onClick={() => load()}>
          Search
        </Button>
      </div>}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Designation</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Work days</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Basic salary</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  {(canManage || isEmployee) && (
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{e.name}</div>
                      <div className="text-xs text-slate-500">{e.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {e.department?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {e.designation || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {(e.workDays?.length ? e.workDays : defaultWorkDays)
                        .map((day) => WEEKDAYS.find((weekday) => weekday.value === day)?.label)
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {e.basicSalary?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={e.isActive ? "active" : "inactive"}>
                        {e.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {(canManage || isEmployee) && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex gap-1">
                          {(canManage || String(e._id) === String(user._id)) && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                              {isEmployee ? "Edit profile" : "Edit"}
                            </Button>
                          )}
                          {user.role === "Admin" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => resetPassword(e)}>
                                Reset login
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => setDeleteId(e._id)}
                              >
                                {e.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!employees.length && (
              <Empty
                title="No employees yet"
                description="Register your first employee to get started."
              />
            )}
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Register Employee" : "Edit Employee"}
        size="lg"
      >
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEmployee && modal === "edit" ? (
              <>
                <Field label="Full name"><p className="text-sm text-slate-700">{form.name}</p></Field>
                <Field label="Email"><p className="text-sm text-slate-700">{form.email}</p></Field>
              </>
            ) : (
              <Field label="Full name *" help="Enter the employee's name as it should appear in the system.">
                <input
                  required
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
            )}
            {modal === "create" && (
              <>
                <Field label="Work email *" help="Used to sign in and receive account updates.">
                  <input
                    type="email"
                    required
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Temporary password *" help="Share this starter password securely. The employee should change it after signing in.">
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </Field>
              </>
            )}
            {!isEmployee && <Field label="Team / department" help="Choose the team this employee belongs to.">
              <select
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">— Select —</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>}
            {!isEmployee && <Field label="Job title" help="For example: HR Officer, Accountant, or Sales Manager.">
              <input
                className="input"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </Field>}
            {!isEmployee && (
              <Field label="Scheduled work days" help="Select the days this employee is expected to work. Attendance is only available on these days.">
                <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-200 p-3">
                  {WEEKDAYS.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.workDays.includes(day.value)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            workDays: e.target.checked
                              ? [...form.workDays, day.value].sort((a, b) => a - b)
                              : form.workDays.filter((selected) => selected !== day.value),
                          })
                        }
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
                {form.workDays.length === 0 && (
                  <p className="mt-1 text-xs text-rose-600">Select at least one working day.</p>
                )}
              </Field>
            )}
            {!isEmployee && <Field label="Monthly basic pay" help="Regular monthly pay before allowances and deductions.">
              <input
                type="number"
                min="0"
                step="any"
                className="input"
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
              />
            </Field>}
            {!isEmployee && <Field label="Monthly allowances" help="Extra monthly pay, such as transport or meals. Enter 0 if there are none.">
              <input
                type="number"
                min="0"
                step="any"
                className="input"
                value={form.allowances}
                onChange={(e) => setForm({ ...form, allowances: e.target.value })}
              />
            </Field>}
            <Field label="Phone number" help="Optional contact number.">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Address" help="Optional home or mailing address.">
            <textarea
              className="input"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!isEmployee && form.workDays.length === 0}>
              {modal === "create" ? "Create" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!temporaryPassword}
        onClose={() => setTemporaryPassword("")}
        title="Temporary login password"
        size="sm"
      >
        <p className="mb-3 text-sm text-slate-600">
          Share this password securely. The employee must change it after signing in.
        </p>
        <code className="block break-all rounded bg-slate-100 p-3 text-sm">{temporaryPassword}</code>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setTemporaryPassword("")}>Done</Button>
        </div>
      </Modal>

      {/* Delete / Toggle confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Status Change"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-5">
          This will activate or deactivate the employee account. They will not be able to login if deactivated.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Input helper styles via global-ish class */}
      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
      {help && <p className="mt-1 text-xs leading-relaxed text-slate-500">{help}</p>}
    </div>
  );
}
