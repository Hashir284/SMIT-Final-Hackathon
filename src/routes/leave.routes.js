import express from "express";
import {
  applyLeave,
  getLeaves,
  getMyBalance,
  reviewLeave,
  cancelLeave,
} from "../controllers/leave.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", applyLeave);
router.get("/", getLeaves);
router.get("/balance", getMyBalance);
router.put("/:id/review", authorize("HR", "Admin"), reviewLeave);
router.put("/:id/cancel", cancelLeave);

export default router;
