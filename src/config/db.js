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

import mongoose from 'mongoose';

// Global cache variable taake serverless re-runs par duplicate connections na banein
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    // Agar pehle se connected hai toh purana connection return kar do
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected:', mongoose.connection.host);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;