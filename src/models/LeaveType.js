import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // annual, sick, casual, unpaid, etc.
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    yearlyQuota: {
      type: Number,
      default: 10,
    },
    // Is paid leave?
    isPaid: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveType", leaveTypeSchema);
