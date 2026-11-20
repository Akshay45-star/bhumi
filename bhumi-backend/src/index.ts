import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

import authRouter     from "./routes/auth";
import checkinsRouter from "./routes/checkins";
import messagesRouter from "./routes/messages";
import assetsRouter   from "./routes/assets";
import usersRouter    from "./routes/users";
import deadmanRouter  from "./routes/deadman";
import lettersRouter  from "./routes/letters";
import familyRouter    from "./routes/family";
import promptsRouter   from "./routes/prompts";
import documentsRouter from "./routes/documents";
import accountRouter   from "./routes/account";
import { startAllJobs } from "./jobs/cron";
import { mountWebPlayer } from "./web-player/mount";

const app  = express();
const PORT = parseInt(process.env.PORT ?? "3000");

// Trust Railway/proxy so rate-limit sees real IPs, not proxy IPs
app.set("trust proxy", 1);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    "https://bhumi.app",
    "https://watch.bhumi.app",
    /^http:\/\/localhost/,
    /^exp:\/\//,
  ],
  credentials: true,
}));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                      // 5 OTP requests per IP per hour
  message: { error: "Too many OTP requests. Try again in an hour." },
});
app.use(limiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({
  status: "ok",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     otpLimiter, authRouter);
app.use("/api/checkins", checkinsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/assets",   assetsRouter);
app.use("/api/users",    usersRouter);
app.use("/api/deadman",  deadmanRouter);
app.use("/api/letters",  lettersRouter);
app.use("/api/family",    familyRouter);
app.use("/api/prompts",   promptsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/account",   accountRouter);

// ─── Web player (recipient watch page) ───────────────────────────────────────
mountWebPlayer(app);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Bhumi API running on port ${PORT}`);
  startAllJobs();
});

export default app;
