import { Router } from "express";
import { getCurrentUser, googleLogin, login, logout, signup } from "../controllers/auth.controller.js";
import { adminOnly, loginCheck } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/config", (req, res) => {
	res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
});
router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/me", loginCheck, getCurrentUser);
router.get("/admin-check", loginCheck, adminOnly, (req, res) => {
	res.json({ status: "success", message: "Admin access granted" });
});

export default router;
