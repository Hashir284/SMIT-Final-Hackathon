import dns from "node:dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])
import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./src/config/db.js"
import path from "path"

const app = express();

app.use(cors({ origin: ["http://localhost:3000", "*"], credentials: true }))
app.use(express.json());

app.get('/api/health', async (req, res) => {
    res.json({ status: 'success', message: 'API is Working' })
})

const startServer = async () => {
    const PORT = process.env.PORT || 8000;
    try {
        await connectDB();
    } catch (error) {
        console.error("Failed to start server:", error.message);
    }
};

startServer();

const __dirname = path.resolve()
const __frontend = path.join(__dirname, './web/dist')
app.use('/', express.static(__frontend))
app.use('/*splat', express.static(__frontend))

app.listen(8000, () => {
    console.log('Your Code is Running at http://localhost:8000');
})
