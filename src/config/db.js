import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
        //     Value	State
        // 0	Disconnected
        // 1	Connected
        // 2	Connecting
        // 3	Disconnecting
    }

    const uri = process?.env?.MONGO_URI;

    if (!uri) {
        console.error("MONGO_URI is not set in the environment.");
        throw new Error("MONGO_URI is missing");
    }

    try {
        // mongoose.set("strictQuery", true);
        const conn = await mongoose.connect(uri)
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

export default connectDB;