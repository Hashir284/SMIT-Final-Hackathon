import express from "express";
import { chat, summarizeDashboard } from "../controllers/ai.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/chat", chat);
router.post("/summarize", authorize("Admin", "HR"), summarizeDashboard);

export default router;
