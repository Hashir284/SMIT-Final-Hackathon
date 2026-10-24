import Company from "../models/Company.js";
import Department from "../models/Department.js";
import LeaveType from "../models/LeaveType.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import { logAction } from "../utils/audit.js";
import { randomBytes } from "node:crypto";

// ========== COMPANY ==========

export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne();
    if (company && req.user.role !== "Admin") {
      return res.json({
        success: true,
        company: {
          _id: company._id,
          name: company.name,
          officeStartTime: company.officeStartTime,
          officeEndTime: company.officeEndTime,
          graceMinutes: company.graceMinutes,
          halfDayHours: company.halfDayHours,
          weekendDays: company.weekendDays,
          officeAddress: company.officeAddress,
        },
      });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const before = company.toObject();
    const fields = [
      "name", "officeStartTime", "officeEndTime", "graceMinutes",
      "halfDayHours", "weekendDays", "officeLatitude", "officeLongitude",
      "officeRadius", "officeAddress", "leaveQuotas",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) company[f] = req.body[f];
    });

    await company.save();
    await logAction({
      actor: req.user._id,
      action: "update",
      entity: "Company",
      entityId: company._id,
      before,
      after: company.toObject(),
    });

    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DEPARTMENTS ==========

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const dept = await Department.create({ name, description });
    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "Department",
      entityId: dept._id,
      after: dept.toObject(),
    });
    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Department already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const before = dept.toObject();
    if (req.body.name !== undefined) dept.name = req.body.name;
    if (req.body.description !== undefined) dept.description = req.body.description;
    await dept.save();
    await logAction({
      actor: req.user._id,
      action: "update",
      entity: "Department",
      entityId: dept._id,
      before,
      after: dept.toObject(),
    });
    res.json({ success: true, department: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    // Soft check - employees linked?
    const count = await User.countDocuments({ department: req.params.id });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${count} employee(s) linked to this department.`,
      });
    }
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
    await logAction({
      actor: req.user._id,
      action: "delete",
      entity: "Department",
      entityId: dept._id,
      before: dept.toObject(),
    });
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== LEAVE TYPES ==========

export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    res.json({ success: true, leaveTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const { name, code, yearlyQuota, isPaid } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code required" });
    }
    const lt = await LeaveType.create({
      name,
      code: code.toLowerCase(),
      yearlyQuota: yearlyQuota || 10,
      isPaid: isPaid !== false,
    });
    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "LeaveType",
      entityId: lt._id,
      after: lt.toObject(),
    });
    res.status(201).json({ success: true, leaveType: lt });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Leave type already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const lt = await LeaveType.findById(req.params.id);
    if (!lt) return res.status(404).json({ success: false, message: "Not found" });
    const before = lt.toObject();
    ["name", "yearlyQuota", "isPaid", "isActive"].forEach((field) => {
      if (req.body[field] !== undefined) lt[field] = req.body[field];
    });
    await lt.save();
    await logAction({
      actor: req.user._id,
      action: "update",
      entity: "LeaveType",
      entityId: lt._id,
      before,
      after: lt.toObject(),
    });
    res.json({ success: true, leaveType: lt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== HOLIDAYS ==========

export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json({ success: true, holidays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, isRecurring } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, message: "Name and date required" });
    }
    const h = await Holiday.create({ name, date, isRecurring: !!isRecurring });
    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "Holiday",
      entityId: h._id,
      after: h.toObject(),
    });
    res.status(201).json({ success: true, holiday: h });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: "Holiday not found" });
    await logAction({
      actor: req.user._id,
      action: "delete",
      entity: "Holiday",
      entityId: holiday._id,
      before: holiday.toObject(),
    });
    res.json({ success: true, message: "Holiday deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== HR USERS (Admin creates HR) ==========

export const createHR = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const hr = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "HR",
      mustChangePassword: true,
    });
    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "User",
      entityId: hr._id,
      after: { name: hr.name, email: hr.email, role: "HR" },
    });
    res.status(201).json({
      success: true,
      user: {
        _id: hr._id,
        name: hr.name,
        email: hr.email,
        role: hr.role,
      },
      message: "HR created. Temporary password set.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHRs = async (req, res) => {
  try {
    const hrs = await User.find({ role: "HR" }).select("-password");
    res.json({ success: true, users: hrs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagedUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["HR", "Employee"] } })
      .select("name email role isActive mustChangePassword")
      .sort({ role: 1, name: 1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleManagedUserStatus = async (req, res) => {
  try {
    const account = await User.findById(req.params.id);
    if (!account || !["HR", "Employee"].includes(account.role)) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const before = { isActive: account.isActive };
    account.isActive = !account.isActive;
    await account.save();
    await logAction({
      actor: req.user._id,
      action: account.isActive ? "activate" : "deactivate",
      entity: account.role,
      entityId: account._id,
      before,
      after: { isActive: account.isActive },
    });

    res.json({
      success: true,
      message: account.isActive ? "Account activated" : "Account deactivated",
      isActive: account.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetManagedUserPassword = async (req, res) => {
  try {
    const account = await User.findById(req.params.id);
    if (!account || !["HR", "Employee"].includes(account.role)) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const temporaryPassword = randomBytes(12).toString("base64url");
    account.password = temporaryPassword;
    account.mustChangePassword = true;
    await account.save();
    await logAction({
      actor: req.user._id,
      action: "reset_password",
      entity: account.role,
      entityId: account._id,
    });

    res.json({
      success: true,
      temporaryPassword,
      message: "Temporary password created. Share it securely; the user must change it at next sign-in.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
