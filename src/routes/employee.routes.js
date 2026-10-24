import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  toggleEmployeeStatus,
} from "../controllers/employee.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getEmployees);
router.get("/:id", getEmployee);
router.post("/", authorize("HR", "Admin"), createEmployee);
router.put("/:id", updateEmployee); // role checks inside
router.patch("/:id/toggle", authorize("Admin"), toggleEmployeeStatus);

export default router;
