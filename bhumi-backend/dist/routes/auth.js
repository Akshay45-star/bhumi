"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const pool_1 = require("../db/pool");
const sms_1 = require("../services/sms");
const email_1 = require("../services/email");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ─── Helper: send OTP via email ───────────────────────────────────────────────
async function sendOTPEmail(email, code) {
    await (0, email_1.sendEmail)(email, "Your sign-in", "Your Bhumi verification code", `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="font-size:32px;font-weight:900;color:#1A0F0A;margin-bottom:8px">भ Bhumi</div>
      <p style="color:#6B5344;font-size:15px;line-height:1.6">Your verification code is:</p>
      <div style="background:#F7F4F0;border-radius:16px;padding:28px;text-align:center;margin:20px 0;border:1px solid rgba(196,119,59,0.2)">
        <span style="font-size:40px;font-weight:900;color:#C4773B;letter-spacing:12px">${code}</span>
      </div>
      <p style="color:#9C8070;font-size:13px">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
    </div>`);
}
// ─── POST /auth/send-otp ──────────────────────────────────────────────────────
// Accepts phone (legacy) OR email. If email provided, sends code via email.
router.post("/send-otp", async (req, res) => {
    try {
        const schema = zod_1.z.object({
            phone: zod_1.z.string().min(4).max(20).optional(),
            email: zod_1.z.string().email().max(200).optional(),
        }).refine(d => d.phone || d.email, { message: "phone or email required" });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: "Phone or email required" });
            return;
        }
        const { phone, email } = result.data;
        const identifier = email ? email.toLowerCase().trim() : phone;
        const isEmail = !!email;
        const code = (0, sms_1.generateOTP)();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // Invalidate previous OTPs
        await (0, pool_1.query)("UPDATE otp_codes SET used = TRUE WHERE phone = $1 AND used = FALSE", [identifier]);
        const codeHash = await bcryptjs_1.default.hash(code, 10);
        await (0, pool_1.query)("INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)", [identifier, codeHash, expiresAt]);
        if (isEmail) {
            await sendOTPEmail(identifier, code);
        }
        else {
            // SMS fallback — logs to console if Twilio not configured
            const { sendOTP } = await Promise.resolve().then(() => __importStar(require("../services/sms")));
            await sendOTP(identifier, code);
        }
        res.json({ ok: true, message: isEmail ? "Code sent to your email" : "OTP sent" });
    }
    catch (err) {
        console.error("[auth] POST /send-otp", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
    try {
        const schema = zod_1.z.object({
            phone: zod_1.z.string().optional(),
            email: zod_1.z.string().email().optional(),
            code: zod_1.z.string().length(6),
            name: zod_1.z.string().max(100).optional(),
        }).refine(d => d.phone || d.email, { message: "phone or email required" });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: "Invalid request" });
            return;
        }
        const { phone, email, code, name } = result.data;
        const identifier = email ? email.toLowerCase().trim() : phone;
        const otp = await (0, pool_1.queryOne)("SELECT id, code, expires_at FROM otp_codes WHERE phone = $1 AND used = FALSE ORDER BY created_at DESC LIMIT 1", [identifier]);
        const valid = otp ? await bcryptjs_1.default.compare(code, otp.code) : false;
        if (!otp || !valid) {
            res.status(401).json({ error: "Invalid code" });
            return;
        }
        if (new Date(otp.expires_at) < new Date()) {
            res.status(401).json({ error: "Code expired — request a new one" });
            return;
        }
        await (0, pool_1.query)("UPDATE otp_codes SET used = TRUE WHERE id = $1", [otp.id]);
        // Upsert user — email users store identifier in email column, phone in phone column
        let user = await (0, pool_1.queryOne)(email
            ? "SELECT id, name, phone, email, is_pro FROM users WHERE email = $1"
            : "SELECT id, name, phone, email, is_pro FROM users WHERE phone = $1", [identifier]);
        if (!user) {
            const fakePhone = email ? `email_${crypto_1.default.randomBytes(6).toString("hex")}` : identifier;
            user = await (0, pool_1.queryOne)("INSERT INTO users (phone, name, email) VALUES ($1, $2, $3) RETURNING id, name, phone, email, is_pro", [email ? fakePhone : identifier, name ?? null, email ?? null]);
            await (0, pool_1.query)("INSERT INTO notification_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user.id]);
        }
        else if (name && !user.name) {
            await (0, pool_1.query)("UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2", [name, user.id]);
            user.name = name;
        }
        const token = (0, auth_1.signToken)(user.id);
        res.json({ token, user });
    }
    catch (err) {
        console.error("[auth] POST /verify-otp", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /auth/apple ─────────────────────────────────────────────────────────
// Apple Sign In — receives identityToken from iOS, upserts user, returns JWT
router.post("/apple", async (req, res) => {
    try {
        const schema = zod_1.z.object({
            identityToken: zod_1.z.string().min(10),
            fullName: zod_1.z.string().max(100).optional(),
            email: zod_1.z.string().email().optional(),
            appleUserId: zod_1.z.string().min(5),
        });
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ error: "Invalid Apple credentials" });
            return;
        }
        const { appleUserId, fullName, email } = result.data;
        // Find or create user by apple_user_id
        let user = await (0, pool_1.queryOne)("SELECT id, name, phone, email, is_pro FROM users WHERE apple_user_id = $1", [appleUserId]);
        if (!user) {
            // First sign in — create account
            const fakePhone = `apple_${appleUserId.slice(0, 16)}`;
            user = await (0, pool_1.queryOne)(`INSERT INTO users (phone, name, email, apple_user_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, phone, email, is_pro`, [fakePhone, fullName ?? null, email ?? null, appleUserId]);
            await (0, pool_1.query)("INSERT INTO notification_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [user.id]);
        }
        else if (fullName && !user.name) {
            await (0, pool_1.query)("UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2", [fullName, user.id]);
            user.name = fullName;
        }
        const token = (0, auth_1.signToken)(user.id);
        res.json({ token, user });
    }
    catch (err) {
        console.error("[auth] POST /apple", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
