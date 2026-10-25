import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Button from "../components/ui/Button";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const [email, setEmail] = useState("hashiradmin@email.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "rectangular",
      });
    };
    document.body.appendChild(script);
  }, []);

  async function handleGoogleResponse(response) {
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/google", { credential: response.credential });
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-teal-500 items-center justify-center text-white font-bold text-lg mb-3 shadow-lg shadow-teal-500/30">
            H
          </div>
          <h1 className="text-2xl font-semibold text-white">HCM Lite</h1>
          <p className="text-slate-400 text-sm mt-1">AI-assisted Human Capital Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2.5">
              {error}
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <>
              <div ref={googleBtnRef} className="flex justify-center mb-5" />
              <div className="flex items-center gap-3 mb-5 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                or continue with email
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading} size="lg">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
