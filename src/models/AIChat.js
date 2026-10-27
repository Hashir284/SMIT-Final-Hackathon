import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userMessage: {
      type: String,
      required: true,
      trim: true,
    },
    assistantMessage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

aiChatSchema.index({ user: 1, createdAt: 1 });

const AIChat = mongoose.model("AIChat", aiChatSchema);

export default AIChat;
