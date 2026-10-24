import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export default function FirstRun() {
  const [form, setForm] = useState({
    companyName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    officeStartTime: "09:00",
    officeEndTime: "18:00",
    graceMinutes: 15,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { firstRun } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await firstRun(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="mb-6">
          <div className="inline-flex w-10 h-10 rounded-lg bg-teal-500 items-center justify-center text-white font-bold mb-3">H</div>
          <h1 className="text-xl font-semibold text-slate-900">Welcome to HCM Lite</h1>
          <p className="text-sm text-slate-500 mt-1">First-run setup — create company & Admin account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2.5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Company Name *">
            <input name="companyName" required className="field" value={form.companyName} onChange={handleChange} />
          </Field>
          <Field label="Admin Full Name *">
            <input name="adminName" required className="field" value={form.adminName} onChange={handleChange} />
          </Field>
          <Field label="Admin Email *">
            <input type="email" name="adminEmail" required className="field" value={form.adminEmail} onChange={handleChange} />
          </Field>
          <Field label="Admin Password * (min 6)">
            <input type="password" name="adminPassword" required minLength={6} className="field" value={form.adminPassword} onChange={handleChange} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start">
              <input type="time" name="officeStartTime" className="field" value={form.officeStartTime} onChange={handleChange} />
            </Field>
            <Field label="End">
              <input type="time" name="officeEndTime" className="field" value={form.officeEndTime} onChange={handleChange} />
            </Field>
            <Field label="Grace (min)">
              <input type="number" name="graceMinutes" className="field" value={form.graceMinutes} onChange={handleChange} />
            </Field>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Complete Setup
          </Button>
        </form>
      </div>
      <style>{`
        .field { width:100%; border-radius:0.5rem; border:1px solid #e2e8f0; padding:0.5rem 0.75rem; font-size:0.875rem; outline:none; }
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
