import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User Schema
 * Roles: Admin | HR | Employee
 * First-run creates the Admin account
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Employee"],
      required: true,
    },
    // Employee-specific fields (null for Admin/HR)
    employeeId: {
      type: String,
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    designation: {
      type: String,
      default: null,
    },
    workDays: {
      type: [Number],
      default: [],
      validate: {
        validator: (days) =>
          Array.isArray(days) &&
          days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
          new Set(days).size === days.length,
        message: "Work days must be unique days of the week (0-6)",
      },
    },
    phone: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    // Salary structure (for Employee)
    basicSalary: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Force password change on first login (for employees created by HR)
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    // Profile
    profilePicture: {
      type: String,
      default: null,
    },
    joiningDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
