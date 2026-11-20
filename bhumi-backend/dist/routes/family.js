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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const sms_1 = require("../services/sms");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// Rate-limit the public invite-info endpoint so it can't enumerate creator names
const inviteInfoLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many requests" },
    standardHeaders: true,
    legacyHeaders: false,
});
// ─── List my family connections ───────────────────────────────────────────────
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const connections = await (0, pool_1.query)(`SELECT fc.*,
              u.name  AS member_name,
              u.phone AS member_phone,
              u.email AS member_email,
              (SELECT COUNT(*) FROM milestone_messages mm
               WHERE mm.recipient_connection_id = fc.id
                 AND mm.is_recorded = TRUE) AS message_count,
              (SELECT COUNT(*) FROM milestone_messages mm
               WHERE mm.recipient_connection_id = fc.id
                 AND mm.is_opened = TRUE) AS opened_count
       FROM family_connections fc
       LEFT JOIN users u ON u.id = fc.member_id
       WHERE fc.creator_id = $1
       ORDER BY fc.created_at DESC`, [userId]);
        res.json({ connections });
    }
    catch (err) {
        console.error("[family] GET /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Invite a family member ───────────────────────────────────────────────────
router.post("/invite", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).trim(),
        phone: zod_1.z.string().max(25).optional(),
        email: zod_1.z.string().email().max(200).optional(),
    }).refine((d) => d.phone || d.email, { message: "Phone or email required" });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    try {
        const userId = req.userId;
        const { name, phone, email } = result.data;
        const creator = await (0, pool_1.queryOne)("SELECT name FROM users WHERE id = $1", [userId]);
        const connection = await (0, pool_1.queryOne)(`INSERT INTO family_connections (creator_id, invite_name, invite_phone, invite_email)
       VALUES ($1, $2, $3, $4) RETURNING *`, [userId, name, phone ?? null, email ?? null]);
        const inviteUrl = `${process.env.APP_URL}/join/${connection.invite_token}`;
        const creatorName = creator?.name ?? "Someone";
        if (phone) {
            await (0, sms_1.sendInviteSMS)(phone.trim(), creatorName, name.trim(), inviteUrl).catch(console.error);
        }
        if (email) {
            await (0, email_1.sendInviteEmail)(email.trim(), name.trim(), creatorName, inviteUrl).catch(console.error);
        }
        res.status(201).json({ connection });
    }
    catch (err) {
        console.error("[family] POST /invite", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Accept an invite (family member opens deep link, creates/logs in, calls this) ──
router.post("/accept/:token", auth_1.requireAuth, async (req, res) => {
    try {
        const { token } = req.params;
        const memberId = req.userId;
        const connection = await (0, pool_1.queryOne)("SELECT * FROM family_connections WHERE invite_token = $1 AND status = 'pending'", [token]);
        if (!connection) {
            res.status(404).json({ error: "Invite not found or already accepted" });
            return;
        }
        if (connection.creator_id === memberId) {
            res.status(400).json({ error: "You cannot accept your own invite" });
            return;
        }
        await (0, pool_1.query)(`UPDATE family_connections
       SET member_id = $1, status = 'connected', connected_at = NOW(), accepted_at = NOW()
       WHERE id = $2`, [memberId, connection.id]);
        const creator = await (0, pool_1.queryOne)("SELECT id, name, phone FROM users WHERE id = $1", [connection.creator_id]);
        res.json({ connected: true, creator });
    }
    catch (err) {
        console.error("[family] POST /accept/:token", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Get pending invite info (before sign-up — shown on landing page) ────────
router.get("/invite/:token", inviteInfoLimiter, async (req, res) => {
    try {
        const { token } = req.params;
        const connection = await (0, pool_1.queryOne)(`SELECT fc.invite_name, fc.status, u.name AS creator_name
       FROM family_connections fc
       JOIN users u ON u.id = fc.creator_id
       WHERE fc.invite_token = $1`, [token]);
        if (!connection) {
            res.status(404).json({ error: "Invite not found" });
            return;
        }
        res.json({ connection });
    }
    catch (err) {
        console.error("[family] GET /invite/:token", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Family member: get messages left for me ─────────────────────────────────
router.get("/inbox", auth_1.requireAuth, async (req, res) => {
    try {
        const memberId = req.userId;
        const messages = await (0, pool_1.query)(`SELECT mm.id,
              mm.title,
              mm.trigger_type,
              mm.trigger_event_key,
              mm.trigger_date,
              mm.is_unlocked,
              mm.unlocked_at,
              mm.is_opened,
              mm.opened_at,
              mm.delivery_token,
              mm.is_recorded,
              u.name  AS creator_name,
              fc.invite_name AS creator_label
       FROM milestone_messages mm
       JOIN family_connections fc ON fc.id = mm.recipient_connection_id
       JOIN users u ON u.id = mm.user_id
       WHERE fc.member_id = $1
         AND mm.is_recorded = TRUE
       ORDER BY mm.created_at DESC`, [memberId]);
        res.json({ messages });
    }
    catch (err) {
        console.error("[family] GET /inbox", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Family member: open a message (mark read + return video URL) ─────────────
// For milestone/recipient trigger types, a valid pinToken (from /account/message-pin/verify)
// must be provided in the request body. This is the 16-digit personal PIN gate.
router.post("/inbox/:messageId/open", auth_1.requireAuth, async (req, res) => {
    try {
        const memberId = req.userId;
        const { messageId } = req.params;
        const { pinToken } = req.body; // optional — required for milestone/recipient types
        const message = await (0, pool_1.queryOne)(`SELECT mm.*, fc.creator_id, u.name AS creator_name
       FROM milestone_messages mm
       JOIN family_connections fc ON fc.id = mm.recipient_connection_id
       JOIN users u ON u.id = mm.user_id
       WHERE mm.id = $1 AND fc.member_id = $2`, [messageId, memberId]);
        if (!message) {
            res.status(404).json({ error: "Message not found" });
            return;
        }
        if (!message.is_unlocked && message.trigger_type !== "recipient") {
            res.status(403).json({ error: "This message is not yet unlocked" });
            return;
        }
        // PIN gate: milestone and recipient-decides messages require the 16-digit PIN
        const requiresPin = message.trigger_type === "recipient" || message.trigger_type === "life_event";
        if (requiresPin) {
            if (!pinToken) {
                res.status(401).json({ error: "PIN required", requiresPin: true });
                return;
            }
            // Validate the pinToken issued by /account/message-pin/verify
            const user = await (0, pool_1.queryOne)("SELECT email_verify_token, email_verify_expires FROM users WHERE id = $1", [memberId]);
            const tokenValid = user?.email_verify_token === `pin:${pinToken}` &&
                user?.email_verify_expires &&
                new Date(user.email_verify_expires) > new Date();
            if (!tokenValid) {
                res.status(401).json({ error: "PIN session expired. Please re-enter your PIN.", requiresPin: true });
                return;
            }
        }
        if (!message.is_opened) {
            await (0, pool_1.query)("UPDATE milestone_messages SET is_opened = TRUE, opened_at = NOW() WHERE id = $1", [messageId]);
            if (message.trigger_type === "recipient") {
                await (0, pool_1.query)("UPDATE milestone_messages SET is_unlocked = TRUE, unlocked_at = NOW(), unlocked_by = 'recipient' WHERE id = $1", [messageId]);
            }
        }
        // Notify creator that their message was opened
        notifyCreatorOpened(message, memberId).catch(console.error);
        const { getSignedPlayUrl } = await Promise.resolve().then(() => __importStar(require("../services/storage")));
        const playUrl = message.video_key ? await getSignedPlayUrl(message.video_key) : null;
        res.json({
            id: message.id,
            title: message.title,
            creatorName: message.creator_name,
            playUrl,
            textContent: message.text_content,
            recordedAt: message.created_at,
        });
    }
    catch (err) {
        console.error("[family] POST /inbox/:messageId/open", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Notify creator when recipient opens a message ────────────────────────────
async function notifyCreatorOpened(msg, memberId) {
    const member = await (0, pool_1.queryOne)("SELECT name, push_token FROM users WHERE id = $1", [memberId]);
    const creator = await (0, pool_1.queryOne)("SELECT push_token FROM users WHERE id = $1", [msg.user_id]);
    if (creator?.push_token) {
        await sendExpoPush(creator.push_token, `${member?.name ?? "Someone"} opened your message 💌`, `"${msg.title}" was opened. Your words reached them.`).catch(console.error);
    }
}
// ─── Family member: announce a life event → unlock matching messages ──────────
router.post("/announce", auth_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({
        eventKey: zod_1.z.string().min(1).max(100),
        eventLabel: zod_1.z.string().max(100).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    try {
        const memberId = req.userId;
        const { eventKey, eventLabel } = result.data;
        await (0, pool_1.query)("INSERT INTO life_event_announcements (user_id, event_key, event_label) VALUES ($1, $2, $3)", [memberId, eventKey, eventLabel ?? eventKey]);
        const unlocked = await (0, pool_1.query)(`UPDATE milestone_messages mm
       SET is_unlocked = TRUE, unlocked_at = NOW(), unlocked_by = 'life_event'
       FROM family_connections fc
       WHERE mm.recipient_connection_id = fc.id
         AND fc.member_id = $1
         AND mm.trigger_type = 'life_event'
         AND mm.trigger_event_key = $2
         AND mm.is_unlocked = FALSE
         AND mm.is_recorded = TRUE
       RETURNING mm.*`, [memberId, eventKey]);
        for (const msg of unlocked) {
            notifyCreatorOfEvent(msg, eventKey, memberId).catch(console.error);
        }
        res.json({ unlocked: unlocked.length, messages: unlocked });
    }
    catch (err) {
        console.error("[family] POST /announce", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── Notify creator that a life event fired one of their messages ─────────────
async function notifyCreatorOfEvent(msg, eventKey, memberId) {
    const member = await (0, pool_1.queryOne)("SELECT name, push_token FROM users WHERE id = $1", [memberId]);
    const creator = await (0, pool_1.queryOne)("SELECT push_token FROM users WHERE id = $1", [msg.user_id]);
    console.log(`[FAMILY] ${member?.name} announced '${eventKey}' — unlocked message: "${msg.title}" for user ${msg.user_id}`);
    if (creator?.push_token) {
        await sendExpoPush(creator.push_token, "💌 Message unlocked", `${member?.name ?? "Someone"} just announced "${eventKey}" — your message was delivered.`).catch(console.error);
    }
}
// ─── Send Expo push notification ─────────────────────────────────────────────
async function sendExpoPush(token, title, body) {
    if (!token.startsWith("ExponentPushToken"))
        return;
    await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ to: token, title, body, sound: "default" }),
    });
}
exports.default = router;
