import Attendance from "../models/Attendance.js";
import Company from "../models/Company.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";
import {
  toDateStr,
  timeToMinutes,
  calcWorkedHours,
  getDistanceMeters,
  getEmployeeWorkingDays,
} from "../utils/helpers.js";
import { logAction } from "../utils/audit.js";
import Notification from "../models/Notification.js";

/**
 * Check-in (web)
 */
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = toDateStr();
    const now = new Date();

    // Already checked in?
    let record = await Attendance.findOne({ employee: employeeId, dateStr: today });
    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today",
      });
    }

    const company = await Company.findOne();
    if (!company) {
      return res.status(400).json({ success: false, message: "Company not set up" });
    }

    const day = new Date(`${today}T00:00:00.000Z`).getUTCDay();
    if (!getEmployeeWorkingDays(req.user, company).includes(day)) {
      return res.status(400).json({ success: false, message: "Today is not one of your scheduled work days" });
    }

    // Check holiday
    const holiday = await Holiday.findOne({
      date: {
        $gte: new Date(today + "T00:00:00.000Z"),
        $lte: new Date(today + "T23:59:59.999Z"),
      },
    });
    if (holiday) {
      return res.status(400).json({ success: false, message: `Today is holiday: ${holiday.name}` });
    }

    // Check approved leave
    const onLeave = await LeaveRequest.findOne({
      employee: employeeId,
      status: "approved",
      startDate: { $lte: now },
      endDate: { $gte: new Date(today + "T00:00:00.000Z") },
    });
    if (onLeave) {
      return res.status(400).json({ success: false, message: "You are on approved leave today" });
    }

    // Calculate late
    const startMins = timeToMinutes(company.officeStartTime);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const grace = company.graceMinutes || 15;
    let status = "present";
    let lateMinutes = 0;

    if (nowMins > startMins + grace) {
      status = "late";
      lateMinutes = nowMins - startMins;
    }

    if (!record) {
      record = await Attendance.create({
        employee: employeeId,
        date: new Date(today),
        dateStr: today,
        checkIn: now,
        status,
        lateMinutes,
        source: "web",
      });
    } else {
      record.checkIn = now;
      record.status = status;
      record.lateMinutes = lateMinutes;
      record.source = "web";
      await record.save();
    }

    await logAction({
      actor: req.user._id,
      action: "check_in",
      entity: "Attendance",
      entityId: record._id,
      after: { dateStr: today, status: record.status, source: "web" },
    });

    res.json({
      success: true,
      message: status === "late" ? `Checked in (Late by ${lateMinutes} min)` : "Checked in successfully",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check-out
 */
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = toDateStr();
    const now = new Date();

    const record = await Attendance.findOne({ employee: employeeId, dateStr: today });
    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: "Please check-in first" });
    }
    if (record.checkOut) {
      return res.status(400).json({ success: false, message: "Already checked out" });
    }

    const company = await Company.findOne();
    const worked = calcWorkedHours(record.checkIn, now);
    record.checkOut = now;
    record.workedHours = worked;

    // Half day if under threshold
    if (worked < (company?.halfDayHours || 5)) {
      record.status = "half";
    }

    await record.save();
    await logAction({
      actor: req.user._id,
      action: "check_out",
      entity: "Attendance",
      entityId: record._id,
      after: { dateStr: today, workedHours: worked },
    });

    res.json({
      success: true,
      message: "Checked out successfully",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Today's attendance for current user
 */
export const getMyToday = async (req, res) => {
  try {
    const today = toDateStr();
    const record = await Attendance.findOne({
      employee: req.user._id,
      dateStr: today,
    });
    res.json({ success: true, attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Attendance board / calendar (HR/Admin see all, Employee own)
 */
export const getAttendance = async (req, res) => {
  try {
    const { date, from, to, employee, department, correctionStatus } = req.query;
    const filter = {};

    if (req.user.role === "Employee") {
      filter.employee = req.user._id;
    } else if (employee) {
      filter.employee = employee;
    }

    if (date) {
      filter.dateStr = date;
    } else if (from && to) {
      filter.dateStr = { $gte: from, $lte: to };
    } else {
      // default today
      filter.dateStr = toDateStr();
    }
    if (
      correctionStatus &&
      ["none", "pending", "approved", "rejected"].includes(correctionStatus)
    ) {
      filter.correctionStatus = correctionStatus;
      delete filter.dateStr;
    }

    let records = await Attendance.find(filter)
      .populate({
        path: "employee",
        select: "name email designation department",
        populate: { path: "department", select: "name" },
      })
      .sort({ dateStr: -1, checkIn: 1 });

    // Filter by department if needed
    if (department && req.user.role !== "Employee") {
      records = records.filter(
        (r) => r.employee?.department && String(r.employee.department._id) === department
      );
    }

    res.json({ success: true, records, count: records.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manual correction request by employee
 */
export const requestCorrection = async (req, res) => {
  try {
    const { dateStr, note } = req.body;
    if (typeof dateStr !== "string" || typeof note !== "string" || !dateStr || !note) {
      return res.status(400).json({ success: false, message: "dateStr and note required" });
    }
    const requestedDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ||
      Number.isNaN(requestedDate.getTime()) ||
      requestedDate.toISOString().slice(0, 10) !== dateStr ||
      dateStr > toDateStr()
    ) {
      return res.status(400).json({ success: false, message: "Choose a valid date that is not in the future" });
    }
    const company = await Company.findOne();
    const requestedDay = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();
    if (!getEmployeeWorkingDays(req.user, company).includes(requestedDay)) {
      return res.status(400).json({
        success: false,
        message: "That date is not one of your scheduled work days",
      });
    }
    if (!note.trim()) {
      return res.status(400).json({ success: false, message: "A reason is required" });
    }

    let record = await Attendance.findOne({
      employee: req.user._id,
      dateStr,
    });
    if (record?.correctionStatus === "pending") {
      return res.status(400).json({ success: false, message: "A correction is already awaiting review" });
    }

    if (!record) {
      record = await Attendance.create({
        employee: req.user._id,
        date: new Date(dateStr),
        dateStr,
        status: "absent",
        correctionRequest: note,
        correctionStatus: "pending",
      });
    } else {
      record.correctionRequest = note;
      record.correctionStatus = "pending";
      await record.save();
    }

    await logAction({
      actor: req.user._id,
      action: "correction_requested",
      entity: "Attendance",
      entityId: record._id,
      after: { dateStr, note },
    });

    res.json({ success: true, message: "Correction request submitted", attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * HR approves / rejects correction
 */
export const reviewCorrection = async (req, res) => {
  try {
    const { status, checkIn, checkOut, newStatus } = req.body; // status: approved | rejected
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid review status" });
    }
    if (record.correctionStatus !== "pending") {
      return res.status(400).json({ success: false, message: "No pending correction to review" });
    }

    if (status === "approved") {
      if (
        newStatus !== undefined &&
        !["present", "late", "half", "absent", "on_leave", "holiday", "weekend"].includes(newStatus)
      ) {
        return res.status(400).json({ success: false, message: "Invalid attendance status" });
      }
      const parsedCheckIn = checkIn ? new Date(checkIn) : null;
      const parsedCheckOut = checkOut ? new Date(checkOut) : null;
      if (
        (parsedCheckIn && Number.isNaN(parsedCheckIn.getTime())) ||
        (parsedCheckOut && Number.isNaN(parsedCheckOut.getTime())) ||
        (parsedCheckIn && parsedCheckOut && parsedCheckOut <= parsedCheckIn)
      ) {
        return res.status(400).json({ success: false, message: "Enter valid attendance times" });
      }
      if (parsedCheckIn) record.checkIn = parsedCheckIn;
      if (parsedCheckOut) record.checkOut = parsedCheckOut;
      if (newStatus) record.status = newStatus;
      if (record.checkIn && record.checkOut) {
        record.workedHours = calcWorkedHours(record.checkIn, record.checkOut);
      }
      record.correctionStatus = "approved";
    } else {
      record.correctionStatus = "rejected";
    }

    await record.save();
    await logAction({
      actor: req.user._id,
      action: "correction_" + status,
      entity: "Attendance",
      entityId: record._id,
    });
    await Notification.create({
      user: record.employee,
      title: `Attendance correction ${status}`,
      message: `Your attendance correction for ${record.dateStr} was ${status}.`,
      link: "/attendance",
    });

    res.json({ success: true, attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Camera / location based check-in (bonus)
 */
export const cameraCheckIn = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: "Location required" });
    }

    const company = await Company.findOne();
    if (!company?.officeLatitude || !company?.officeLongitude) {
      return res.status(400).json({
        success: false,
        message: "Office location not configured by Admin",
      });
    }

    const dist = getDistanceMeters(
      lat,
      lng,
      company.officeLatitude,
      company.officeLongitude
    );

    if (dist > (company.officeRadius || 150)) {
      return res.status(400).json({
        success: false,
        message: `You are outside office radius (${Math.round(dist)}m away, allowed ${company.officeRadius}m)`,
      });
    }

    const employeeId = req.user._id;
    const today = toDateStr();
    const now = new Date();
    const day = new Date(`${today}T00:00:00.000Z`).getUTCDay();
    if (!getEmployeeWorkingDays(req.user, company).includes(day)) {
      return res.status(400).json({ success: false, message: "Today is not one of your scheduled work days" });
    }

    const holiday = await Holiday.findOne({
      date: {
        $gte: new Date(`${today}T00:00:00.000Z`),
        $lte: new Date(`${today}T23:59:59.999Z`),
      },
    });
    if (holiday) {
      return res.status(400).json({ success: false, message: `Today is holiday: ${holiday.name}` });
    }
    const onLeave = await LeaveRequest.findOne({
      employee: employeeId,
      status: "approved",
      startDate: { $lte: now },
      endDate: { $gte: new Date(`${today}T00:00:00.000Z`) },
    });
    if (onLeave) {
      return res.status(400).json({ success: false, message: "You are on approved leave today" });
    }

    let record = await Attendance.findOne({ employee: employeeId, dateStr: today });
    if (record && record.checkIn) {
      return res.status(400).json({ success: false, message: "Already checked in" });
    }

    const startMins = timeToMinutes(company.officeStartTime);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const grace = company.graceMinutes || 15;
    let status = "present";
    let lateMinutes = 0;
    if (nowMins > startMins + grace) {
      status = "late";
      lateMinutes = nowMins - startMins;
    }

    if (!record) {
      record = await Attendance.create({
        employee: employeeId,
        date: new Date(today),
        dateStr: today,
        checkIn: now,
        status,
        lateMinutes,
        source: "camera",
        location: { lat, lng },
      });
    } else {
      record.checkIn = now;
      record.status = status;
      record.lateMinutes = lateMinutes;
      record.source = "camera";
      record.location = { lat, lng };
      await record.save();
    }

    await logAction({
      actor: req.user._id,
      action: "check_in",
      entity: "Attendance",
      entityId: record._id,
      after: { dateStr: today, status: record.status, source: "camera" },
    });

    res.json({
      success: true,
      message: "Camera check-in successful",
      attendance: record,
      distance: Math.round(dist),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
