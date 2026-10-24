import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export default function ChangePassword() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setUser({ ...user, mustChangePassword: false });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Change Password</h1>
        <p className="text-sm text-slate-500 mb-6">You must update your temporary password to continue</p>
        {error && <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2.5">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password (min 6)</label>
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNew(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500" />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Update Password</Button>
        </form>
      </div>
    </div>
  );
}
