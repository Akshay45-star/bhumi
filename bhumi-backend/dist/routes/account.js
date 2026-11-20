"use strict";
/**
 * Account Portability & Security Routes
 *
 * POST /account/message-pin/setup   — set the 16-digit message PIN for the first time
 * POST /account/message-pin/verify  — verify the PIN before opening a sealed message
 * POST /account/message-pin/reset   — reset PIN via recovery code
 * POST /account/phone/change-request — request a phone number change (sends OTP to new phone)
 * POST /account/phone/change-confirm — confirm OTP and swap phone
 * POST /account/recovery-email      — set / update the recovery email
 * POST /account/recover-by-email    — send a recovery link to the recovery email
 * POST /account/recover-confirm     — confirm recovery token, issue new JWT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const sms_1 = require("../services/sms");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// ─── Helper: generate a random 16-digit numeric PIN ───────────────────────────
function generateMessagePIN() {
    // 16 cryptographically random digits — grouped 4-4-4-4 for display
    const digits = Array.from({ length: 16 }, () => crypto_1.default.randomInt(0, 10));
    return digits.join("");
}
function formatPIN(raw) {
    return raw.replace(/(.{4})/g, "$1-").slice(0, 19); // "1234-5678-9012-3456"
}
// ─── POST /account/message-pin/setup ─────────────────────────────────────────
// Called when user sets their PIN for the first time.
// Returns the PIN ONCE — never stored in plaintext. User must write it down.
router.post("/message-pin/setup", auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    try {
        const existing = await (0, pool_1.queryOne)("SELECT message_pin_hash FROM users WHERE id = $1", [userId]);
        if (existing?.message_pin_hash) {
            res.status(400).json({ error: "PIN already set. Use reset to change it." });
            return;
        }
        const pin = generateMessagePIN();
        const pinHash = await bcryptjs_1.default.hash(pin, 12);
        await (0, pool_1.query)("UPDATE users SET message_pin_hash = $2, message_pin_set_at = NOW(), updated_at = NOW() WHERE id = $1", [userId, pinHash]);
        // Return the raw PIN exactly once — display it, then forget it
        res.json({ pin: formatPIN(pin), message: "Write this down. It will never be shown again." });
    }
    catch (err) {
        console.error("[account] POST /message-pin/setup", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/message-pin/verify ────────────────────────────────────────
// Called before opening a milestone / sealed message. Returns a short-lived token.
router.post("/message-pin/verify", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ pin: zod_1.z.string().min(16).max(19) }); // with or without dashes
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "PIN required" });
        return;
    }
    const userId = req.userId;
    const rawPin = result.data.pin.replace(/-/g, ""); // strip dashes
    try {
        const user = await (0, pool_1.queryOne)("SELECT message_pin_hash FROM users WHERE id = $1", [userId]);
        if (!user?.message_pin_hash) {
            res.status(400).json({ error: "No PIN set. Set your PIN first." });
            return;
        }
        const valid = await bcryptjs_1.default.compare(rawPin, user.message_pin_hash);
        if (!valid) {
            res.status(401).json({ error: "Incorrect PIN" });
            return;
        }
        // Issue a short-lived (5 min) PIN-verified token the client attaches to the open request
        const pinToken = crypto_1.default.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        // Store in cache-like column — reuse email_verify_token slot (repurposed for PIN session)
        await (0, pool_1.query)("UPDATE users SET email_verify_token = $2, email_verify_expires = $3 WHERE id = $1", [userId, `pin:${pinToken}`, expires]);
        res.json({ pinToken, expiresAt: expires });
    }
    catch (err) {
        console.error("[account] POST /message-pin/verify", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/message-pin/reset ─────────────────────────────────────────
// Reset PIN using the recovery code. Issues a new PIN.
router.post("/message-pin/reset", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ recoveryCode: zod_1.z.string().min(16).max(32) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Recovery code required" });
        return;
    }
    const userId = req.userId;
    try {
        const user = await (0, pool_1.queryOne)("SELECT recovery_code_hash FROM users WHERE id = $1", [userId]);
        if (!user?.recovery_code_hash) {
            res.status(400).json({ error: "No recovery code on file. Contact support@bhumi.app" });
            return;
        }
        const rawCode = result.data.recoveryCode.replace(/-/g, "").toUpperCase();
        const valid = await bcryptjs_1.default.compare(rawCode, user.recovery_code_hash);
        if (!valid) {
            res.status(401).json({ error: "Incorrect recovery code" });
            return;
        }
        const newPin = generateMessagePIN();
        const newPinHash = await bcryptjs_1.default.hash(newPin, 12);
        await (0, pool_1.query)("UPDATE users SET message_pin_hash = $2, message_pin_set_at = NOW(), updated_at = NOW() WHERE id = $1", [userId, newPinHash]);
        res.json({ pin: formatPIN(newPin), message: "Write this down. It will never be shown again." });
    }
    catch (err) {
        console.error("[account] POST /message-pin/reset", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/phone/change-request ───────────────────────────────────────
// User wants to change their phone number. Send OTP to the NEW number.
router.post("/phone/change-request", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ newPhone: zod_1.z.string().min(8).max(20) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Valid phone number required" });
        return;
    }
    const userId = req.userId;
    const newPhone = result.data.newPhone.trim();
    try {
        // Phone must not already be in use
        const existing = await (0, pool_1.queryOne)("SELECT id FROM users WHERE phone = $1 AND id != $2", [newPhone, userId]);
        if (existing) {
            res.status(409).json({ error: "That phone number is already registered to another account" });
            return;
        }
        const code = (0, sms_1.generateOTP)();
        const codeHash = await bcryptjs_1.default.hash(code, 10);
        const expires = new Date(Date.now() + 10 * 60 * 1000);
        // Invalidate previous requests for this user
        await (0, pool_1.query)("UPDATE phone_change_requests SET used = TRUE WHERE user_id = $1 AND used = FALSE", [userId]);
        await (0, pool_1.query)("INSERT INTO phone_change_requests (user_id, new_phone, code_hash, expires_at) VALUES ($1, $2, $3, $4)", [userId, newPhone, codeHash, expires]);
        await (0, sms_1.sendOTP)(newPhone, code);
        res.json({ ok: true, message: "OTP sent to your new number" });
    }
    catch (err) {
        console.error("[account] POST /phone/change-request", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/phone/change-confirm ───────────────────────────────────────
// Confirm OTP and actually swap the phone number on the account.
router.post("/phone/change-confirm", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ code: zod_1.z.string().length(6) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "6-digit code required" });
        return;
    }
    const userId = req.userId;
    try {
        const req_ = await (0, pool_1.queryOne)("SELECT * FROM phone_change_requests WHERE user_id = $1 AND used = FALSE ORDER BY created_at DESC LIMIT 1", [userId]);
        if (!req_) {
            res.status(400).json({ error: "No pending phone change. Request one first." });
            return;
        }
        if (new Date(req_.expires_at) < new Date()) {
            res.status(400).json({ error: "Code expired. Request a new one." });
            return;
        }
        const valid = await bcryptjs_1.default.compare(result.data.code, req_.code_hash);
        if (!valid) {
            res.status(401).json({ error: "Incorrect code" });
            return;
        }
        await (0, pool_1.query)("UPDATE phone_change_requests SET used = TRUE WHERE id = $1", [req_.id]);
        await (0, pool_1.query)("UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1", [userId, req_.new_phone]);
        res.json({ ok: true, newPhone: req_.new_phone });
    }
    catch (err) {
        console.error("[account] POST /phone/change-confirm", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/recovery-email ─────────────────────────────────────────────
// Set or update the recovery email address.
router.post("/recovery-email", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email().max(200) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Valid email required" });
        return;
    }
    const userId = req.userId;
    try {
        await (0, pool_1.query)("UPDATE users SET recovery_email = $2, email_verified = FALSE, updated_at = NOW() WHERE id = $1", [userId, result.data.email.toLowerCase().trim()]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[account] POST /recovery-email", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/recover-by-email — send recovery link ─────────────────────
// Public endpoint — user has lost their phone, enters recovery email.
router.post("/recover-by-email", async (req, res) => {
    const schema = zod_1.z.object({ email: zod_1.z.string().email() });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Valid email required" });
        return;
    }
    try {
        const user = await (0, pool_1.queryOne)("SELECT id, name FROM users WHERE recovery_email = $1", [result.data.email.toLowerCase().trim()]);
        // Always return success to prevent email enumeration
        if (!user) {
            res.json({ ok: true });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        await (0, pool_1.query)("UPDATE users SET email_verify_token = $2, email_verify_expires = $3, updated_at = NOW() WHERE id = $1", [user.id, `recover:${token}`, expires.toISOString()]);
        const recoveryUrl = `${process.env.APP_URL}/recover/${token}`;
        await (0, email_1.sendEmail)(result.data.email, user.name ?? "Bhumi user", "Recover your Bhumi account", `<p>Hi ${user.name ?? "there"},</p>
       <p>Click the link below to recover your Bhumi account. This link expires in 30 minutes.</p>
       <p><a href="${recoveryUrl}" style="background:#C4773B;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Recover My Account →</a></p>
       <p>If you didn't request this, ignore this email.</p>`);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[account] POST /recover-by-email", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /account/recover-confirm ────────────────────────────────────────────
// Confirms recovery token and issues a new JWT.
// User then updates their phone via /phone/change-request.
router.post("/recover-confirm", async (req, res) => {
    const schema = zod_1.z.object({ token: zod_1.z.string().min(32).max(64), newPhone: zod_1.z.string().min(8).max(20) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "Token and new phone required" });
        return;
    }
    try {
        const user = await (0, pool_1.queryOne)("SELECT id, name, phone FROM users WHERE email_verify_token = $1 AND email_verify_expires > NOW()", [`recover:${result.data.token}`]);
        if (!user) {
            res.status(400).json({ error: "Recovery link is invalid or expired" });
            return;
        }
        // Check new phone not taken
        const taken = await (0, pool_1.queryOne)("SELECT id FROM users WHERE phone = $1 AND id != $2", [result.data.newPhone, user.id]);
        if (taken) {
            res.status(409).json({ error: "That phone number is already registered" });
            return;
        }
        // Swap phone, clear recovery token
        await (0, pool_1.query)("UPDATE users SET phone = $2, email_verify_token = NULL, email_verify_expires = NULL, updated_at = NOW() WHERE id = $1", [user.id, result.data.newPhone]);
        const jwtToken = (0, auth_1.signToken)(user.id);
        res.json({ token: jwtToken, user: { id: user.id, name: user.name, phone: result.data.newPhone } });
    }
    catch (err) {
        console.error("[account] POST /recover-confirm", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
