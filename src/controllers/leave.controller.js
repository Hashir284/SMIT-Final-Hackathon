import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import Holiday from "../models/Holiday.js";
import Company from "../models/Company.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import {
  countWorkingDays,
  getEmployeeWorkingDays,
  toDateStr,
} from "../utils/helpers.js";
import { logAction } from "../utils/audit.js";
import Notification from "../models/Notification.js";

/**
 * Apply for leave
 */
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "leaveTypeId, startDate and endDate are required",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      return res.status(400).json({ success: false, message: "Invalid leave type" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, message: "End date before start date" });
    }

    const company = await Company.findOne();
    const holidays = await Holiday.find();
    const holidayDates = holidays.map((h) => h.date);
    const employee = await User.findById(req.user._id).select("workDays");
    const workDays = getEmployeeWorkingDays(employee, company);
    const nonWorkingDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => !workDays.includes(day));

    const days = countWorkingDays(
      start,
      end,
      nonWorkingDays,
      holidayDates
    );

    if (days <= 0) {
      return res.status(400).json({
        success: false,
        message: "No working days in selected range (weekend/holiday)",
      });
    }

    // Check balance
    const year = start.getFullYear();
    const used = await LeaveRequest.aggregate([
      {
        $match: {
          employee: req.user._id,
          leaveType: leaveType._id,
          status: "approved",
          startDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$days" } } },
    ]);

    const usedDays = used[0]?.total || 0;
    const quota = leaveType.yearlyQuota;
    if (usedDays + days > quota) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Used: ${usedDays}/${quota}, Requested: ${days}`,
      });
    }

    // Overlap check
    const overlap = await LeaveRequest.findOne({
      employee: req.user._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Overlapping leave request already exists",
      });
    }

    const leave = await LeaveRequest.create({
      employee: req.user._id,
      leaveType: leaveType._id,
      startDate: start,
      endDate: end,
      days,
      reason: reason || "",
      status: "pending",
    });

    const populated = await LeaveRequest.findById(leave._id)
      .populate("leaveType", "name code isPaid")
      .populate("employee", "name email");

    await logAction({
      actor: req.user._id,
      action: "apply",
      entity: "LeaveRequest",
      entityId: leave._id,
      after: { startDate: start, endDate: end, days, status: "pending" },
    });

    res.status(201).json({ success: true, leave: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get leave requests
 */
export const getLeaves = async (req, res) => {
  try {
    const { status, employee } = req.query;
    const filter = {};

    if (req.user.role === "Employee") {
      filter.employee = req.user._id;
    } else if (employee) {
      filter.employee = employee;
    }

    if (status) filter.status = status;

    const leaves = await LeaveRequest.find(filter)
      .populate("leaveType", "name code isPaid yearlyQuota")
      .populate("employee", "name email designation")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * My leave balance
 */
export const getMyBalance = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const leaveTypes = await LeaveType.find({ isActive: true });

    const balances = await Promise.all(
      leaveTypes.map(async (lt) => {
        const used = await LeaveRequest.aggregate([
          {
            $match: {
              employee: req.user._id,
              leaveType: lt._id,
              status: "approved",
              startDate: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
              },
            },
          },
          { $group: { _id: null, total: { $sum: "$days" } } },
        ]);
        const usedDays = used[0]?.total || 0;
        return {
          leaveType: { _id: lt._id, name: lt.name, code: lt.code, isPaid: lt.isPaid },
          quota: lt.yearlyQuota,
          used: usedDays,
          remaining: Math.max(0, lt.yearlyQuota - usedDays),
        };
      })
    );

    res.json({ success: true, balances, year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * HR Approve / Reject leave
 */
export const reviewLeave = async (req, res) => {
  try {
    const { status, comment } = req.body; // approved | rejected
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    if (typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({ success: false, message: "A review comment is required" });
    }

    const leave = await LeaveRequest.findById(req.params.id)
      .populate("leaveType")
      .populate("employee");

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Already reviewed" });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewComment = comment.trim();
    leave.reviewedAt = new Date();
    await leave.save();

    // If approved → mark attendance as on_leave for those days
    if (status === "approved") {
      const company = await Company.findOne();
      const holidays = await Holiday.find();
      const holidaySet = new Set(holidays.map((h) => toDateStr(h.date)));
      const workDays = getEmployeeWorkingDays(leave.employee, company);

      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      cur.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);
      while (cur <= end) {
        const ds = toDateStr(cur);
        const day = cur.getUTCDay();
        if (workDays.includes(day) && !holidaySet.has(ds)) {
          await Attendance.findOneAndUpdate(
            { employee: leave.employee._id, dateStr: ds },
            {
              employee: leave.employee._id,
              date: new Date(ds),
              dateStr: ds,
              status: "on_leave",
              notes: `Leave: ${leave.leaveType.name}`,
            },
            { upsert: true }
          );
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    await logAction({
      actor: req.user._id,
      action: status,
      entity: "LeaveRequest",
      entityId: leave._id,
    });
    await Notification.create({
      user: leave.employee._id,
      title: `Leave request ${status}`,
      message: comment.trim(),
      link: "/leaves",
    });

    res.json({ success: true, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel own pending leave
 */
export const cancelLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    if (String(leave.employee) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not your leave" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Can only cancel pending" });
    }
    leave.status = "cancelled";
    await leave.save();
    await logAction({
      actor: req.user._id,
      action: "cancel",
      entity: "LeaveRequest",
      entityId: leave._id,
      before: { status: "pending" },
      after: { status: "cancelled" },
    });
    res.json({ success: true, message: "Leave cancelled", leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
