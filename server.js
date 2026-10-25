import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";

// Routes
import authRoutes from "./src/routes/auth.routes.js";
import orgRoutes from "./src/routes/org.routes.js";
import employeeRoutes from "./src/routes/employee.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import leaveRoutes from "./src/routes/leave.routes.js";
import payrollRoutes from "./src/routes/payroll.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import commsRoutes from "./src/routes/comms.routes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/comms", commsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "success", message: "HCM Lite API is Working" });
});

// Serve frontend (production build)
const __dirname = path.resolve();
const __frontend = path.join(__dirname, "./web/dist");
app.use("/", express.static(__frontend));
app.use("/*splat", express.static(__frontend));
// app.get("*", (req, res, next) => {
//   if (req.path === "/api" || req.path.startsWith("/api/")) {
//     return next();
//   }

//   res.sendFile(path.join(__frontend, "index.html"));
// });
// Disable caching for index.html so browser always gets the latest version
app.use("/", express.static(__frontend, {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) {
      // HTML file par cache na lagaye taake naya bundle link foran mil jaye
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
}));

// Start server
const startServer = async () => {
  const PORT = process.env.PORT || 8000;
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`🚀 HCM Lite API running at http://localhost:${PORT}`);
      console.log(`📁 Serving frontend from: ${__frontend}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the other server or set a different PORT in .env.`
        );
        process.exit(1);
        return;
      }

      console.error("Failed to start server:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
