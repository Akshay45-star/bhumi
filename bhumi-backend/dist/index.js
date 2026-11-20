"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const checkins_1 = __importDefault(require("./routes/checkins"));
const messages_1 = __importDefault(require("./routes/messages"));
const assets_1 = __importDefault(require("./routes/assets"));
const users_1 = __importDefault(require("./routes/users"));
const deadman_1 = __importDefault(require("./routes/deadman"));
const letters_1 = __importDefault(require("./routes/letters"));
const family_1 = __importDefault(require("./routes/family"));
const prompts_1 = __importDefault(require("./routes/prompts"));
const documents_1 = __importDefault(require("./routes/documents"));
const account_1 = __importDefault(require("./routes/account"));
const cron_1 = require("./jobs/cron");
const mount_1 = require("./web-player/mount");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? "3000");
// Trust Railway/proxy so rate-limit sees real IPs, not proxy IPs
app.set("trust proxy", 1);
// ─── Security middleware ───────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        "https://bhumi.app",
        "https://watch.bhumi.app",
        /^http:\/\/localhost/,
        /^exp:\/\//,
    ],
    credentials: true,
}));
// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 OTP requests per IP per hour
    message: { error: "Too many OTP requests. Try again in an hour." },
});
app.use(limiter);
// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
}));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", otpLimiter, auth_1.default);
app.use("/api/checkins", checkins_1.default);
app.use("/api/messages", messages_1.default);
app.use("/api/assets", assets_1.default);
app.use("/api/users", users_1.default);
app.use("/api/deadman", deadman_1.default);
app.use("/api/letters", letters_1.default);
app.use("/api/family", family_1.default);
app.use("/api/prompts", prompts_1.default);
app.use("/api/documents", documents_1.default);
app.use("/api/account", account_1.default);
// ─── Web player (recipient watch page) ───────────────────────────────────────
(0, mount_1.mountWebPlayer)(app);
// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Bhumi API running on port ${PORT}`);
    (0, cron_1.startAllJobs)();
});
exports.default = app;
