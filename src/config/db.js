// import mongoose from "mongoose";

// /**
//  * Connect to MongoDB
//  * Uses MONGO_URI from .env
//  */
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//     return conn;
//   } catch (error) {
//     console.error(`❌ MongoDB Connection Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// export default connectDB;

import mongoose from "mongoose";

// Simple in-memory cache store
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute expiry

export const getCachedUser = async (userId) => {
  const cachedData = cache.get(userId);
  
  // Agar cache mein data hai aur expire nahi hua
  if (cachedData && Date.now() < cachedData.expiry) {
    console.log("⚡ Serving from Cache");
    return cachedData.data;
  }

  // Agar cache mein nahi hai, toh DB se fetch karein
  console.log("🔍 Fetching from Database");
  const user = await mongoose.model("User").findById(userId);

  if (user) {
    cache.set(userId, {
      data: user,
      expiry: Date.now() + CACHE_TTL
    });
  }

  return user;
};