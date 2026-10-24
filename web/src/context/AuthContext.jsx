import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const status = await api.get("/auth/setup-status");
      if (status.needsSetup) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }
      const me = await api.get("/auth/me");
      setUser(me.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    setUser(data.user);
    setNeedsSetup(false);
    return data;
  }

  async function firstRun(payload) {
    const data = await api.post("/auth/first-run", payload);
    setUser(data.user);
    setNeedsSetup(false);
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, needsSetup, login, logout, firstRun, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
