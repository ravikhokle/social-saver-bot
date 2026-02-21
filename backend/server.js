import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./src/db/database.js";
import bookmarkRoutes from "./src/routes/bookmarks.js";
import webhookRoutes from "./src/routes/webhook.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends form-encoded

// Routes
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/webhook", webhookRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start
async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Social Saver API running on http://localhost:${PORT}`);
  });
}

start();
