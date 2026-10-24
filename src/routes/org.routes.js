import express from "express";
import {
  getCompany,
  updateCompany,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  getHolidays,
  createHoliday,
  deleteHoliday,
  createHR,
  getHRs,
  getManagedUsers,
  toggleManagedUserStatus,
  resetManagedUserPassword,
} from "../controllers/org.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Company
router.get("/company", getCompany);
router.put("/company", authorize("Admin"), updateCompany);

// Departments
router.get("/departments", getDepartments);
router.post("/departments", authorize("Admin"), createDepartment);
router.put("/departments/:id", authorize("Admin"), updateDepartment);
router.delete("/departments/:id", authorize("Admin"), deleteDepartment);

// Leave Types
router.get("/leave-types", getLeaveTypes);
router.post("/leave-types", authorize("Admin"), createLeaveType);
router.put("/leave-types/:id", authorize("Admin"), updateLeaveType);

// Holidays
router.get("/holidays", getHolidays);
router.post("/holidays", authorize("Admin"), createHoliday);
router.delete("/holidays/:id", authorize("Admin"), deleteHoliday);

// HR users (Admin only)
router.post("/hr", authorize("Admin"), createHR);
router.get("/hr", authorize("Admin"), getHRs);
router.get("/users", authorize("Admin"), getManagedUsers);
router.patch("/users/:id/toggle", authorize("Admin"), toggleManagedUserStatus);
router.post("/users/:id/reset-password", authorize("Admin"), resetManagedUserPassword);

export default router;
