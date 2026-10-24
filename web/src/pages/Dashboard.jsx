import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { StatsSkeleton, CardSkeleton } from "../components/ui/Skeleton";
import Empty from "../components/ui/Empty";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [sumLoading, setSumLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard");
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function askSummary() {
    setSumLoading(true);
    try {
      const res = await api.post("/ai/summarize", {});
      setSummary(res.summary);
    } catch (err) {
      setSummary(err.message);
    } finally {
      setSumLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 skeleton mb-2" />
          <div className="h-4 w-64 skeleton" />
        </div>
        <StatsSkeleton count={6} />
        <div className="grid md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Employee view
  if (user.role === "Employee") {
    return (
      <div>
        <Header title="My Dashboard" subtitle="Your attendance and leaves at a glance" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Today Status"
            value={data?.todayAttendance?.status || "Not checked in"}
            tone="teal"
          />
          <StatCard
            label="Hours this month"
            value={Number(data?.kpis?.workedHours || 0).toFixed(1)}
            tone="emerald"
          />
          <StatCard label="Late days this month" value={data?.kpis?.lateCount || 0} tone="amber" />
          <StatCard
            label="Leave days remaining"
            value={data?.kpis?.leaveDaysRemaining ?? "—"}
            tone="violet"
          />
        </div>
        {data?.recentPayslips?.[0] && (
          <Card title="Latest payslip" className="mb-6">
            <p className="text-sm text-slate-600">
              {data.recentPayslips[0].month}: take-home pay{" "}
              <span className="font-semibold text-slate-900">
                {data.recentPayslips[0].netSalary?.toLocaleString()}
              </span>
            </p>
          </Card>
        )}
        <Card title="Recent Leaves">
          {data?.recentLeaves?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Days</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentLeaves.map((l) => (
                  <tr key={l._id}>
                    <td className="py-2.5">{l.leaveType?.name}</td>
                    <td className="py-2.5">{l.days}</td>
                    <td className="py-2.5">
                      <Badge status={l.status}>{l.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No leave requests yet" />
          )}
        </Card>
      </div>
    );
  }

  const k = data?.kpis || {};

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Header title="Dashboard" subtitle={`Live overview · ${data?.date || ""}`} />
        {(user.role === "Admin" || user.role === "HR") && (
          <Button variant="secondary" loading={sumLoading} onClick={askSummary}>
            ✦ AI Summarize
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Headcount" value={k.headcount || 0} tone="slate" />
        <StatCard label="Present" value={k.present || 0} tone="emerald" />
        <StatCard label="On Leave" value={k.onLeave || 0} tone="violet" />
        <StatCard label="Late" value={k.late || 0} tone="amber" />
        <StatCard label="Pending Leaves" value={k.pendingLeaves || 0} tone="rose" />
        <StatCard label="Attendance %" value={`${k.attendanceRate || 0}%`} tone="teal" />
        <StatCard label="Absent today" value={k.absent || 0} tone="rose" />
        <StatCard label="Approved leave requests this year" value={data?.leaveThisYear || 0} tone="violet" />
        {user.role === "Admin" && (
          <>
            <StatCard label="Average monthly salary" value={k.averageSalary?.toLocaleString() || 0} tone="violet" />
            <StatCard label="Employee attrition this month" value={`${k.attritionRate || 0}%`} tone="rose" />
          </>
        )}
      </div>

      {summary && (
        <Card title="AI Insights" className="mb-6">
          <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
            {summary}
          </pre>
        </Card>
      )}

      {user.role === "Admin" && data?.payrollSummary && (
        <Card title="Payroll cost this month" className="mb-6">
          <div className="flex flex-wrap gap-8 text-sm">
            <p>
              Total before deductions:{" "}
              <span className="font-semibold">{data.payrollSummary.totalGross?.toLocaleString()}</span>
            </p>
            <p>
              Total take-home pay:{" "}
              <span className="font-semibold">{data.payrollSummary.totalNet?.toLocaleString()}</span>
            </p>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Attendance by Department">
          {data?.byDepartment?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Present</th>
                  <th className="pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.byDepartment.map((d, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-medium text-slate-800">{d.department}</td>
                    <td className="py-2.5 text-emerald-600">{d.present}</td>
                    <td className="py-2.5 text-slate-500">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No departments yet" />
          )}
        </Card>

        <Card title="Late Comers Today">
          {data?.lateComers?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Late (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.lateComers.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2.5">{l.name}</td>
                    <td className="py-2.5 text-amber-600 font-medium">{l.lateMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No late comers" description="Everyone is on time today." />
          )}
        </Card>
      </div>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    teal: "text-teal-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</div>
    </div>
  );
}
