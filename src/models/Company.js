import mongoose from "mongoose";

/**
 * Company Schema
 * Created during first-run setup by Admin
 * Stores office rules, location, and basic settings
 */
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    // Office timing
    officeStartTime: {
      type: String, // "09:00"
      default: "09:00",
    },
    officeEndTime: {
      type: String, // "18:00"
      default: "18:00",
    },
    // Grace period in minutes (late after this)
    graceMinutes: {
      type: Number,
      default: 15,
    },
    // Half day threshold (hours under this = half day)
    halfDayHours: {
      type: Number,
      default: 5,
    },
    // Weekend days (0 = Sunday, 6 = Saturday)
    weekendDays: {
      type: [Number],
      default: [0, 6], // Sat-Sun
    },
    // Office location for geofencing (optional camera attendance)
    officeLatitude: {
      type: Number,
      default: null,
    },
    officeLongitude: {
      type: Number,
      default: null,
    },
    // Radius in meters
    officeRadius: {
      type: Number,
      default: 150,
    },
    // Address text
    officeAddress: {
      type: String,
      default: null,
    },
    // Yearly leave quotas (defaults)
    leaveQuotas: {
      annual: { type: Number, default: 14 },
      sick: { type: Number, default: 8 },
      casual: { type: Number, default: 10 },
    },
    // Is setup complete?
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
