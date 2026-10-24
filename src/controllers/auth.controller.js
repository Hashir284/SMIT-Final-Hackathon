import User from "../models/User.js";
import Company from "../models/Company.js";
import jwt from "jsonwebtoken";
import { logAction } from "../utils/audit.js";

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Send token in cookie + response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE_DAYS || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  // Remove password from response
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    department: user.department,
    designation: user.designation,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: userData,
    });
};

/**
 * @desc    Check if system needs first-run setup
 * @route   GET /api/auth/setup-status
 * @access  Public
 */
export const getSetupStatus = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "Admin" });
    const company = await Company.findOne();

    res.json({
      success: true,
      needsSetup: adminCount === 0,
      hasCompany: !!company,
      isSetupComplete: company?.isSetupComplete || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    First-run: Create Admin + Company
 * @route   POST /api/auth/first-run
 * @access  Public (only when no Admin exists)
 */
export const firstRunSetup = async (req, res) => {
  try {
    // Safety: only allow if no Admin exists
    const adminExists = await User.findOne({ role: "Admin" });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Setup already completed. Admin already exists.",
      });
    }

    const {
      // Admin details
      adminName,
      adminEmail,
      adminPassword,
      // Company details
      companyName,
      officeStartTime = "09:00",
      officeEndTime = "18:00",
      graceMinutes = 15,
      halfDayHours = 5,
      officeAddress,
      officeLatitude,
      officeLongitude,
      officeRadius = 150,
    } = req.body;

    // Validation
    if (!adminName || !adminEmail || !adminPassword || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Admin name, email, password and company name are required",
      });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Create Company first
    const company = await Company.create({
      name: companyName,
      officeStartTime,
      officeEndTime,
      graceMinutes,
      halfDayHours,
      officeAddress: officeAddress || null,
      officeLatitude: officeLatitude || null,
      officeLongitude: officeLongitude || null,
      officeRadius,
      isSetupComplete: true,
    });

    // Create Admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "Admin",
      mustChangePassword: false,
    });

    await logAction({
      actor: admin._id,
      action: "first_run_setup",
      entity: "Company",
      entityId: company._id,
      after: { companyName: company.name, adminEmail: admin.email },
    });

    // Send token so Admin is logged in immediately
    sendTokenResponse(admin, 201, res);
  } catch (error) {
    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during setup",
      error: error.message,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user + include password
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Contact Admin.",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * @desc    Change password (especially for first login of employees)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    await logAction({
      actor: user._id,
      action: "change_password",
      entity: "User",
      entityId: user._id,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Google Login (Continue with Google)
 * @route   POST /api/auth/google
 * @access  Public
 *
 * Frontend sends Google ID token (credential).
 * We verify it, find user by email.
 * User must already be registered by Admin/HR (no auto-signup).
 */
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body; // Google ID token from GIS

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: "Google login not configured. Set GOOGLE_CLIENT_ID in .env",
      });
    }

    // Verify token with Google
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.email;
    const picture = payload.picture || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account has no email",
      });
    }

    // Find existing user (must be registered by Admin/HR)
    let user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No account found for this Google email. Please ask HR/Admin to register you first.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Contact Admin.",
      });
    }

    // Optional: update profile picture if empty
    if (picture && !user.profilePicture) {
      user.profilePicture = picture;
      await user.save({ validateBeforeSave: false });
    }

    // Google users don't need mustChangePassword force if they used Google
    // (they never had a temp password flow for Google)
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(401).json({
      success: false,
      message: "Google login failed. Invalid token or configuration.",
      error: error.message,
    });
  }
};
