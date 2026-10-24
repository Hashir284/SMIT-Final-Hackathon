import User from "../models/User.js";
import Department from "../models/Department.js";
import Company from "../models/Company.js";
import { logAction } from "../utils/audit.js";
import { getEmployeeWorkingDays } from "../utils/helpers.js";

/**
 * HR registers a new Employee
 * Creates login with temporary password
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      designation,
      phone,
      address,
      basicSalary,
      allowances,
      joiningDate,
      employeeId,
      workDays,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and temporary password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }
    const schedule = workDays === undefined
      ? getEmployeeWorkingDays(null, await Company.findOne())
      : workDays;
    if (
      !Array.isArray(schedule) ||
      schedule.length === 0 ||
      schedule.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
      new Set(schedule).size !== schedule.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Select at least one valid, unique working day",
      });
    }

    // Validate department if provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(400).json({ success: false, message: "Invalid department" });
      }
    }

    const emp = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "Employee",
      department: department || null,
      designation: designation || null,
      workDays: schedule,
      phone: phone || null,
      address: address || null,
      basicSalary: basicSalary || 0,
      allowances: allowances || 0,
      joiningDate: joiningDate || new Date(),
      employeeId: employeeId || null,
      mustChangePassword: true,
      isActive: true,
    });

    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "Employee",
      entityId: emp._id,
      after: { name: emp.name, email: emp.email, role: "Employee" },
    });

    res.status(201).json({
      success: true,
      employee: {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        designation: emp.designation,
        workDays: emp.workDays,
        basicSalary: emp.basicSalary,
        mustChangePassword: true,
      },
      message: "Employee registered. Temporary password set – must change on first login.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List employees (with search + filters)
 */
export const getEmployees = async (req, res) => {
  try {
    const { search, department, isActive, page = 1, limit = 50 } = req.query;
    const filter = { role: "Employee" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Employee can only see self in directory? No – directory is All for HR/Admin
    // But for safety, if Employee role hits this, return only self
    if (req.user.role === "Employee") {
      filter._id = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [employees, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("department", "name")
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      employees,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single employee (360 view)
 */
export const getEmployee = async (req, res) => {
  try {
    // Employee can only view own profile
    if (req.user.role === "Employee" && req.params.id !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const emp = await User.findById(req.params.id)
      .select("-password")
      .populate("department", "name");

    if (!emp || emp.role !== "Employee") {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, employee: emp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update employee (HR/Admin)
 * Employee can update only phone & address
 */
export const updateEmployee = async (req, res) => {
  try {
    const emp = await User.findById(req.params.id);
    if (!emp || emp.role !== "Employee") {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Role based allowed fields
    if (req.user.role === "Employee") {
      if (String(emp._id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
      // Only phone & address
      if (req.body.phone !== undefined) emp.phone = req.body.phone;
      if (req.body.address !== undefined) emp.address = req.body.address;
    } else {
      // HR / Admin
      const fields = [
        "name", "department", "designation", "workDays", "phone", "address",
        "basicSalary", "allowances", "joiningDate", "employeeId",
      ];
      if (req.body.workDays !== undefined) {
        const days = req.body.workDays;
        if (
          !Array.isArray(days) ||
          days.length === 0 ||
          days.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
          new Set(days).size !== days.length
        ) {
          return res.status(400).json({
            success: false,
            message: "Select at least one valid, unique working day",
          });
        }
      }
      fields.forEach((f) => {
        if (req.body[f] !== undefined) emp[f] = req.body[f];
      });
    }

    await emp.save();
    await logAction({
      actor: req.user._id,
      action: "update",
      entity: "Employee",
      entityId: emp._id,
      after: req.user.role === "Employee"
        ? { phone: emp.phone, address: emp.address }
        : undefined,
    });

    const updated = await User.findById(emp._id)
      .select("-password")
      .populate("department", "name");

    res.json({ success: true, employee: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Deactivate / activate employee
 */
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const emp = await User.findById(req.params.id);
    if (!emp || emp.role !== "Employee") {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const before = { isActive: emp.isActive };
    emp.isActive = !emp.isActive;
    await emp.save();
    await logAction({
      actor: req.user._id,
      action: emp.isActive ? "activate" : "deactivate",
      entity: "Employee",
      entityId: emp._id,
      before,
      after: { isActive: emp.isActive },
    });
    res.json({
      success: true,
      message: emp.isActive ? "Employee activated" : "Employee deactivated",
      isActive: emp.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
