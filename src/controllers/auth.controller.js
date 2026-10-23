import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	maxAge: 24 * 60 * 60 * 1000,
};

const publicUser = (user) => ({
	_id: user._id,
	first_name: user.first_name,
	last_name: user.last_name,
	email: user.email,
	role: user.role,
});

export const signup = async (req, res) => {
	const { first_name, last_name, email, password } = req.body ?? {};
	if (!first_name || !last_name || !email || !password) {
		return res.status(400).json({ status: "error", message: "Required parameters are missing" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = await User.create({
			first_name,
			last_name,
			email,
			password: hashedPassword,
		});

		return res.status(201).json({
			status: "success",
			message: `User created with email: ${user.email}`,
			user: publicUser(user),
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(400).json({ status: "error", message: "An account with this email already exists" });
		}
		console.error("Signup error:", error);
		return res.status(500).json({ status: "error", message: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	const { email, password } = req.body ?? {};
	if (!email || !password) {
		return res.status(400).json({ status: "error", message: "Email and password are required" });
	}

	try {
		const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select("+password");
		if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ status: "error", message: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ userId: user._id.toString() },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		res.cookie("Token", token, cookieOptions);
		return res.status(200).json({ status: "success", user: publicUser(user) });
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ status: "error", message: "Internal Server Error" });
	}
};

export const googleLogin = async (req, res) => {
	const { credential, idToken } = req.body ?? {};
	const googleToken = credential || idToken;
	if (!googleToken) {
		return res.status(400).json({ status: "error", message: "Google credential is required" });
	}
	if (!process.env.GOOGLE_CLIENT_ID) {
		return res.status(500).json({ status: "error", message: "Google sign-in is not configured" });
	}

	try {
		const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
		const ticket = await googleClient.verifyIdToken({
			idToken: googleToken,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const profile = ticket.getPayload();
		if (!profile?.sub || !profile.email || !profile.email_verified) {
			return res.status(401).json({ status: "error", message: "Google account email is not verified" });
		}

		const email = profile.email.toLowerCase().trim();
		let user = await User.findOne({ googleId: profile.sub });
		if (!user) {
			user = await User.findOne({ email });
			if (user?.googleId && user.googleId !== profile.sub) {
				return res.status(409).json({ status: "error", message: "This email is linked to another Google account" });
			}

			if (!user) {
				const nameParts = (profile.name || "Google User").trim().split(/\s+/);
				user = new User({
					first_name: profile.given_name || nameParts[0] || "Google",
					last_name: profile.family_name || nameParts.slice(1).join(" ") || "User",
					email,
					googleId: profile.sub,
					authProvider: "google",
				});
			} else {
				user.googleId = profile.sub;
			}
			await user.save();
		}

		if (!user.isActive) {
			return res.status(403).json({ status: "error", message: "This account is inactive" });
		}

		const token = jwt.sign(
			{ userId: user._id.toString() },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);
		res.cookie("Token", token, cookieOptions);
		return res.status(200).json({ status: "success", user: publicUser(user) });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ status: "error", message: "An account with this email already exists" });
		}
		console.error("Google login error:", error);
		return res.status(401).json({ status: "error", message: "Google sign-in failed" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("Token", { ...cookieOptions, maxAge: undefined });
	return res.json({ status: "success", message: "Logged out" });
};

export const getCurrentUser = (req, res) => {
	return res.json({ status: "success", user: publicUser(req.user) });
};
