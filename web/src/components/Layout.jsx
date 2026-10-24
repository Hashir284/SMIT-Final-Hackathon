import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "./ui/Badge";

const links = [
  { to: "/", label: "Dashboard", icon: "◈", roles: ["Admin", "HR", "Employee"] },
  { to: "/employees", label: "Employees", icon: "◎", roles: ["Admin", "HR"] },
  { to: "/employees", label: "My Profile", icon: "◎", roles: ["Employee"] },
  { to: "/attendance", label: "Attendance", icon: "◷", roles: ["Admin", "HR", "Employee"] },
  { to: "/leaves", label: "Leaves", icon: "☰", roles: ["Admin", "HR", "Employee"] },
  { to: "/payroll", label: "Payroll", icon: "₹", roles: ["Admin", "HR", "Employee"] },
  { to: "/organization", label: "Organization", icon: "⬡", roles: ["Admin"] },
  { to: "/ai", label: "AI Assistant", icon: "✦", roles: ["Admin", "HR", "Employee"] },
  { to: "/announcements", label: "Announcements", icon: "◉", roles: ["Admin", "HR", "Employee"] },
  { to: "/audit", label: "Audit Log", icon: "▣", roles: ["Admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-slate-900 text-slate-300 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
              H
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">HCM Lite</div>
              <div className="text-[10px] text-slate-500">HR Management</div>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links
            .filter((l) => l.roles.includes(user?.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setSidebarOpen(false)} // Mobile par click karte hi sidebar close ho jaye
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 font-medium"
                      : "hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span className="text-base w-5 text-center opacity-70">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-medium truncate">{user?.name}</div>
              <Badge status={user?.role}>{user?.role}</Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-slate-800 transition"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-60 min-h-screen flex flex-col w-full">
        {/* Top Header Bar for Mobile (Hamburger Menu) */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-800 text-sm">HCM Lite</span>
          <div className="w-6" /> {/* Spacer for alignment */}
        </header>

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}