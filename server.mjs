import dns from "node:dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])
import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./src/config/db.js"
import path from "path"
import cookieParser from "cookie-parser"
import authRoutes from "./src/routes/auth.routes.js"

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true }))
app.use(express.json());
app.use(cookieParser());
app.use("/api", authRoutes);

app.get('/api/health', async (req, res) => {
    res.json({ status: 'success', message: 'API is Working' })
})

const startServer = async () => {
    const PORT = process.env.PORT || 8000;
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Your API is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
    }
};

startServer();

const __dirname = path.resolve()
const __frontend = path.join(__dirname, './web/dist')
app.use('/', express.static(__frontend))
app.use('/*splat', express.static(__frontend))
