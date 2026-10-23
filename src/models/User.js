import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		first_name: { type: String, required: true, trim: true },
		last_name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: {
			type: String,
			required: function () { return this.authProvider === "local"; },
			select: false,
		},
		authProvider: { type: String, enum: ["local", "google"], default: "local" },
		googleId: { type: String, unique: true, sparse: true },
		role: { type: String, enum: ["user", "admin"], default: "user" },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
