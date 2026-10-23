import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const loginCheck = async (req, res, next) => {
	const token = req.cookies?.Token;
	if (!token) {
		return res.status(401).json({ status: "error", message: "Unauthorized" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findOne({ _id: decoded.userId, isActive: true });
		if (!user) {
			res.clearCookie("Token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
			return res.status(401).json({ status: "error", message: "User is no longer active" });
		}

		req.user = user;
		return next();
	} catch {
		res.clearCookie("Token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
		return res.status(401).json({ status: "error", message: "Invalid or expired token" });
	}
};

export const adminOnly = (req, res, next) => {
	if (req.user?.role !== "admin") {
		return res.status(403).json({ status: "error", message: "Access denied. Admin only" });
	}
	return next();
};
