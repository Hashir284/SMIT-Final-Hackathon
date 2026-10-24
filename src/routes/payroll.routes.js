import express from "express";
import {
  runPayroll,
  getPayrolls,
  getPayslip,
  downloadPayslip,
  finalizePayroll,
} from "../controllers/payroll.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getPayrolls);
router.get("/:id/download", downloadPayslip);
router.get("/:id", getPayslip);
router.post("/run", authorize("HR", "Admin"), runPayroll);
router.post("/finalize", authorize("Admin"), finalizePayroll);

export default router;
