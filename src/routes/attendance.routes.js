import express from "express";
import {
  checkIn,
  checkOut,
  getMyToday,
  getAttendance,
  requestCorrection,
  reviewCorrection,
  cameraCheckIn,
} from "../controllers/attendance.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/check-in", authorize("Employee"), checkIn);
router.post("/check-out", authorize("Employee"), checkOut);
router.post("/camera-check-in", authorize("Employee"), cameraCheckIn);
router.get("/my-today", authorize("Employee"), getMyToday);
router.get("/", getAttendance);
router.post("/correction", authorize("Employee"), requestCorrection);
router.put("/correction/:id", authorize("HR", "Admin"), reviewCorrection);

export default router;
