import Payroll from "../models/Payroll.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Company from "../models/Company.js";
import Holiday from "../models/Holiday.js";
import PDFDocument from "pdfkit";
import { calcTax, getEmployeeWorkingDays, toDateStr } from "../utils/helpers.js";
import { logAction } from "../utils/audit.js";

/**
 * Run monthly payroll (HR creates draft)
 * month format: "2026-10"
 */
export const runPayroll = async (req, res) => {
  try {
    const { month } = req.body; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "month required in YYYY-MM format",
      });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthNum = Number(monthStr);

    // Check if already finalized
    const existingFinal = await Payroll.findOne({ month, status: "finalized" });
    if (existingFinal) {
      return res.status(400).json({
        success: false,
        message: "Payroll for this month is already finalized",
      });
    }

    // Delete previous drafts for this month
    await Payroll.deleteMany({ month, status: "draft" });

    const employees = await User.find({ role: "Employee", isActive: true });
    const company = await Company.findOne();

    // Date range
    const startDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
    const holidayRecords = await Holiday.find({
      date: {
        $gte: new Date(`${startDate}T00:00:00.000Z`),
        $lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    }).select("date");
    const holidayDates = new Set(holidayRecords.map(({ date }) => toDateStr(date)));

    const results = [];

    for (const emp of employees) {
      // Attendance stats
      const attRecords = await Attendance.find({
        employee: emp._id,
        dateStr: { $gte: startDate, $lte: endDate },
      });

      let presentDays = 0;
      let lateDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let onLeaveDays = 0;

      attRecords.forEach((r) => {
        if (r.status === "present") presentDays++;
        else if (r.status === "late") {
          presentDays++;
          lateDays++;
        } else if (r.status === "half") halfDays++;
        else if (r.status === "on_leave") onLeaveDays++;
        else if (r.status === "absent") absentDays++;
      });

      // Paid vs unpaid leave
      const leaves = await LeaveRequest.find({
        employee: emp._id,
        status: "approved",
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      }).populate("leaveType");

      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      // Simple: count days that fall in month (approx using onLeaveDays from attendance)
      leaves.forEach((l) => {
        if (l.leaveType?.isPaid) paidLeaveDays += l.days;
        else unpaidLeaveDays += l.days;
      });

      // Working days approx (exclude weekends roughly)
      // Better: count non-weekend days in month
      let workingDays = 0;
      const workDaysOfWeek = getEmployeeWorkingDays(emp, company);
      for (let d = 1; d <= lastDay; d++) {
        const day = new Date(Date.UTC(year, monthNum - 1, d)).getUTCDay();
        const dateString = `${month}-${String(d).padStart(2, "0")}`;
        if (workDaysOfWeek.includes(day) && !holidayDates.has(dateString)) workingDays++;
      }

      const basic = emp.basicSalary || 0;
      const allow = emp.allowances || 0;
      const gross = basic + allow;

      // Daily rate
      const dailyRate = workingDays > 0 ? gross / workingDays : 0;

      // Deductions
      const absentDeduction = absentDays * dailyRate;
      const halfDayDeduction = halfDays * dailyRate * 0.5;
      const unpaidLeaveDeduction = unpaidLeaveDays * dailyRate;
      const tax = calcTax(gross);

      const totalDed =
        absentDeduction + halfDayDeduction + unpaidLeaveDeduction + tax;
      const net = Math.max(0, Math.round(gross - totalDed));

      const payroll = await Payroll.create({
        employee: emp._id,
        month,
        year,
        monthNum,
        basicSalary: basic,
        allowances: allow,
        gross,
        workingDays,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        absentDeduction: Math.round(absentDeduction),
        halfDayDeduction: Math.round(halfDayDeduction),
        unpaidLeaveDeduction: Math.round(unpaidLeaveDeduction),
        tax,
        netSalary: net,
        status: "draft",
      });

      results.push(payroll);
    }

    await logAction({
      actor: req.user._id,
      action: "run_draft",
      entity: "Payroll",
      after: { month, count: results.length },
    });

    res.json({
      success: true,
      message: `Payroll draft created for ${results.length} employees`,
      count: results.length,
      month,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get payroll list
 */
export const getPayrolls = async (req, res) => {
  try {
    const { month, status } = req.query;
    const filter = {};

    if (req.user.role === "Employee") {
      filter.employee = req.user._id;
      filter.status = "finalized";
    }

    if (month) filter.month = month;
    if (status && req.user.role !== "Employee") filter.status = status;

    const payrolls = await Payroll.find(filter)
      .populate("employee", "name email designation department")
      .populate("finalizedBy", "name")
      .sort({ month: -1, "employee.name": 1 });

    res.json({ success: true, payrolls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single payslip
 */
export const getPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "name email designation department phone")
      .populate("finalizedBy", "name");

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Employee can only see own
    if (
      req.user.role === "Employee" &&
      (String(payroll.employee._id) !== String(req.user._id) ||
        payroll.status !== "finalized")
    ) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }

    res.json({ success: true, payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("employee", "name email designation department")
      .populate("finalizedBy", "name");

    if (!payroll || (req.user.role === "Employee" &&
      (String(payroll.employee._id) !== String(req.user._id) || payroll.status !== "finalized"))) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payslip-${payroll.month}.pdf"`
    );
    doc.pipe(res);
    doc.fontSize(20).text("HCM Lite - Payslip", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Employee: ${payroll.employee.name}`);
    doc.text(`Email: ${payroll.employee.email}`);
    doc.text(`Month: ${payroll.month}`);
    doc.text(`Status: ${payroll.status}`);
    doc.moveDown();
    doc.fontSize(14).text("Pay summary");
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Basic pay: ${payroll.basicSalary.toLocaleString()}`);
    doc.text(`Allowances: ${payroll.allowances.toLocaleString()}`);
    doc.text(`Total before deductions: ${payroll.gross.toLocaleString()}`);
    doc.text(`Tax: ${payroll.tax.toLocaleString()}`);
    doc.text(`Absence deduction: ${payroll.absentDeduction.toLocaleString()}`);
    doc.text(`Half-day deduction: ${payroll.halfDayDeduction.toLocaleString()}`);
    doc.text(`Unpaid leave deduction: ${payroll.unpaidLeaveDeduction.toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(14).text(`Take-home pay: ${payroll.netSalary.toLocaleString()}`);
    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.destroy(error);
    }
  }
};

/**
 * Admin finalizes the month (locks it)
 */
export const finalizePayroll = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: "month required" });
    }

    const result = await Payroll.updateMany(
      { month, status: "draft" },
      {
        status: "finalized",
        finalizedBy: req.user._id,
        finalizedAt: new Date(),
      }
    );

    await logAction({
      actor: req.user._id,
      action: "finalize",
      entity: "Payroll",
      after: { month, count: result.modifiedCount },
    });

    res.json({
      success: true,
      message: `Finalized ${result.modifiedCount} payroll records for ${month}`,
      count: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
