import express from "express";
import {
  getSetupStatus,
  firstRunSetup,
  login,
  googleLogin,
  getMe,
  logout,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/setup-status", getSetupStatus);
router.post("/first-run", firstRunSetup);
router.post("/login", login);
router.post("/google", googleLogin);

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/change-password", protect, changePassword);

export default router;
