import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getAuditLogs,
  getNotifications,
  markNotificationRead,
} from "../controllers/comms.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/announcements", getAnnouncements);
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationRead);
router.post("/announcements", authorize("Admin", "HR"), createAnnouncement);
router.delete("/announcements/:id", authorize("Admin", "HR"), deleteAnnouncement);
router.get("/audit", authorize("Admin"), getAuditLogs);

export default router;
