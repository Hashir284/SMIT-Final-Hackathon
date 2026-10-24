import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // YYYY-MM-DD string for easy query
    dateStr: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    // present | late | half | absent | on_leave | holiday
    status: {
      type: String,
      enum: ["present", "late", "half", "absent", "on_leave", "holiday", "weekend"],
      default: "absent",
    },
    // minutes late
    lateMinutes: {
      type: Number,
      default: 0,
    },
    // working hours
    workedHours: {
      type: Number,
      default: 0,
    },
    // source: web | camera | manual
    source: {
      type: String,
      default: "web",
    },
    // for camera check
    location: {
      lat: Number,
      lng: Number,
    },
    notes: {
      type: String,
      default: "",
    },
    // correction request
    correctionRequest: {
      type: String,
      default: null,
    },
    correctionStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
  },
  { timestamps: true }
);

// One record per employee per day
attendanceSchema.index({ employee: 1, dateStr: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
