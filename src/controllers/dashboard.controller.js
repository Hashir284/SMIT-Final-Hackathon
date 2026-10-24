import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";
import LeaveType from "../models/LeaveType.js";
import AuditLog from "../models/AuditLog.js";
import { toDateStr } from "../utils/helpers.js";

/**
 * Admin / HR Dashboard KPIs
 */
export const getDashboard = async (req, res) => {
  try {
    const today = toDateStr();
    const role = req.user.role;

    if (role === "Employee") {
      const year = new Date().getFullYear();
      const monthStart = `${today.slice(0, 7)}-01`;
      const yearStart = `${year}-01-01`;
      const [todayAttendance, monthlyAttendance, recentLeaves, recentPayslips, leaveTypes] =
        await Promise.all([
          Attendance.findOne({ employee: req.user._id, dateStr: today }),
          Attendance.find({
            employee: req.user._id,
            dateStr: { $gte: monthStart, $lte: today },
          }),
          LeaveRequest.find({ employee: req.user._id })
            .populate("leaveType", "name")
            .sort({ createdAt: -1 })
            .limit(5),
          Payroll.find({ employee: req.user._id, status: "finalized" })
            .sort({ month: -1 })
            .limit(3),
          LeaveType.find({ isActive: true }),
        ]);

      const balances = await Promise.all(
        leaveTypes.map(async (leaveType) => {
          const [used] = await LeaveRequest.aggregate([
            {
              $match: {
                employee: req.user._id,
                leaveType: leaveType._id,
                status: "approved",
                startDate: { $gte: new Date(yearStart) },
              },
            },
            { $group: { _id: null, days: { $sum: "$days" } } },
          ]);
          return {
            type: leaveType.name,
            remaining: Math.max(0, leaveType.yearlyQuota - (used?.days || 0)),
          };
        })
      );

      return res.json({
        success: true,
        role,
        todayAttendance,
        recentLeaves,
        recentPayslips,
        kpis: {
          workedHours: monthlyAttendance.reduce((sum, record) => sum + (record.workedHours || 0), 0),
          lateCount: monthlyAttendance.filter((record) => record.status === "late").length,
          leaveDaysRemaining: balances.reduce((sum, balance) => sum + balance.remaining, 0),
        },
      });
    }

    // Common counts
    const totalEmployees = await User.countDocuments({
      role: "Employee",
      isActive: true,
    });

    // Today's attendance
    const todayAtt = await Attendance.find({ dateStr: today }).populate(
      "employee",
      "name department"
    );

    const present = todayAtt.filter((a) =>
      ["present", "late"].includes(a.status)
    ).length;
    const onLeave = todayAtt.filter((a) => a.status === "on_leave").length;
    const late = todayAtt.filter((a) => a.status === "late").length;
    const absent = totalEmployees - present - onLeave;

    // Pending leave approvals
    const pendingLeaves = await LeaveRequest.countDocuments({
      status: "pending",
    });

    // Attendance by department (today)
    const departments = await Department.find({ isActive: true });
    const byDept = await Promise.all(
      departments.map(async (d) => {
        const empIds = await User.find({
          role: "Employee",
          department: d._id,
          isActive: true,
        }).select("_id");
        const ids = empIds.map((e) => e._id);
        const att = todayAtt.filter((a) =>
          ids.some((id) => String(id) === String(a.employee?._id || a.employee))
        );
        return {
          department: d.name,
          present: att.filter((a) => ["present", "late"].includes(a.status)).length,
          total: ids.length,
        };
      })
    );

    // Recent late comers
    const lateComers = todayAtt
      .filter((a) => a.status === "late")
      .map((a) => ({
        name: a.employee?.name,
        lateMinutes: a.lateMinutes,
        checkIn: a.checkIn,
      }));

    // Leave utilization rough
    const approvedLeaves = await LeaveRequest.find({
      status: "approved",
      startDate: { $gte: new Date(new Date().getFullYear(), 0, 1) },
    }).populate("leaveType", "name");

    // Headcount by dept
    const headcountByDept = await User.aggregate([
      { $match: { role: "Employee", isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$dept.name", "Unassigned"] },
          count: 1,
        },
      },
    ]);

    // Payroll cost current month (if exists)
    const thisMonth = today.slice(0, 7);
    const payrollAgg = await Payroll.aggregate([
      { $match: { month: thisMonth } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: "$gross" },
          totalNet: { $sum: "$netSalary" },
          count: { $sum: 1 },
        },
      },
    ]);

    const payload = {
      success: true,
      date: today,
      kpis: {
        headcount: totalEmployees,
        present,
        onLeave,
        late,
        absent: Math.max(0, absent),
        pendingLeaves,
        attendanceRate:
          totalEmployees > 0
            ? Math.round(((present + onLeave) / totalEmployees) * 100)
            : 0,
      },
      byDepartment: byDept,
      lateComers,
      headcountByDept,
      leaveThisYear: approvedLeaves.length,
    };

    if (role === "Admin") {
      const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00.000Z`);
      const [salarySummary, employeeDepartures] = await Promise.all([
        User.aggregate([
          { $match: { role: "Employee", isActive: true } },
          {
            $group: {
              _id: null,
              averageSalary: { $avg: { $add: ["$basicSalary", "$allowances"] } },
            },
          },
        ]),
        AuditLog.countDocuments({
          entity: "Employee",
          action: "deactivate",
          createdAt: { $gte: monthStart },
        }),
      ]);
      payload.kpis.averageSalary = Math.round(salarySummary[0]?.averageSalary || 0);
      payload.kpis.attritionRate = Number(
        (employeeDepartures / Math.max(1, totalEmployees + employeeDepartures) * 100).toFixed(1)
      );
      payload.payrollSummary = payrollAgg[0] || null;
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Simple trend: last 7 days attendance rate
 */
export const getAttendanceTrend = async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(toDateStr(d));
    }

    const totalEmp =
      req.user.role === "Employee"
        ? 1
        : await User.countDocuments({ role: "Employee", isActive: true });

    const trend = await Promise.all(
      days.map(async (ds) => {
        const filter = { dateStr: ds };
        if (req.user.role === "Employee") filter.employee = req.user._id;
        const att = await Attendance.find(filter);
        const present = att.filter((a) =>
          ["present", "late", "half"].includes(a.status)
        ).length;
        return {
          date: ds,
          present,
          rate: totalEmp > 0 ? Math.round((present / totalEmp) * 100) : 0,
        };
      })
    );

    res.json({ success: true, trend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
