import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // e.g. "2026-10"
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    monthNum: {
      type: Number,
      required: true,
    },
    // Salary components
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },

    // Attendance based
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },

    // Deductions
    absentDeduction: { type: Number, default: 0 },
    halfDayDeduction: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },

    netSalary: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["draft", "finalized"],
      default: "draft",
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
