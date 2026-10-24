import express from "express";
import { getDashboard, getAttendanceTrend } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getDashboard);
router.get("/trend", getAttendanceTrend);

export default router;
