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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const storage_1 = require("../services/storage");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// GET /messages
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        const messages = await (0, pool_1.query)("SELECT * FROM milestone_messages WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json({ messages });
    }
    catch (err) {
        console.error("[messages] GET /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /messages — create milestone message
router.post("/", async (req, res) => {
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(1).max(200),
        recipientName: zod_1.z.string().min(1).max(200),
        recipientPhone: zod_1.z.string().max(25).optional(),
        recipientEmail: zod_1.z.string().email().max(200).optional(),
        recipientConnectionId: zod_1.z.string().uuid().optional(),
        triggerType: zod_1.z.enum(["life_event", "date", "deadman", "manual", "recipient"]),
        triggerEventKey: zod_1.z.string().max(100).optional(),
        triggerDate: zod_1.z.string().max(30).optional(),
        unlockAfterDays: zod_1.z.number().int().min(1).max(3650).optional(), // deadman: days of inactivity
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    try {
        const userId = req.userId;
        const { title, recipientName, recipientPhone, recipientEmail, recipientConnectionId, triggerType, triggerEventKey, triggerDate, unlockAfterDays } = result.data;
        const msg = await (0, pool_1.queryOne)(`INSERT INTO milestone_messages
        (user_id, title, recipient_name, recipient_phone, recipient_email,
         recipient_connection_id, trigger_type, trigger_event_key, trigger_date, unlock_after_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`, [userId, title, recipientName, recipientPhone ?? null, recipientEmail ?? null,
            recipientConnectionId ?? null, triggerType, triggerEventKey ?? null, triggerDate ?? null,
            triggerType === "deadman" ? (unlockAfterDays ?? 30) : null]);
        res.status(201).json({ message: msg });
    }
    catch (err) {
        console.error("[messages] POST /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /messages/:id/upload-url
router.post("/:id/upload-url", async (req, res) => {
    try {
        const userId = req.userId;
        const msg = await (0, pool_1.queryOne)("SELECT id, user_id FROM milestone_messages WHERE id = $1", [req.params.id]);
        if (!msg || msg.user_id !== userId) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const { uploadUrl, key } = await (0, storage_1.getUploadPresignedUrl)(userId, "message");
        res.json({ uploadUrl, key });
    }
    catch (err) {
        console.error("[messages] POST /:id/upload-url", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PATCH /messages/:id/record — mark as recorded after upload
router.patch("/:id/record", async (req, res) => {
    const schema = zod_1.z.object({ videoKey: zod_1.z.string().min(1).max(500) });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: "videoKey required" });
        return;
    }
    try {
        const userId = req.userId;
        const msg = await (0, pool_1.queryOne)("UPDATE milestone_messages SET video_key = $1, is_recorded = TRUE WHERE id = $2 AND user_id = $3 RETURNING *", [result.data.videoKey, req.params.id, userId]);
        if (!msg) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ message: msg });
    }
    catch (err) {
        console.error("[messages] PATCH /:id/record", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /messages/:id/play — creator previews their own recorded message
router.get("/:id/play", async (req, res) => {
    try {
        const userId = req.userId;
        const msg = await (0, pool_1.queryOne)("SELECT * FROM milestone_messages WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
        if (!msg) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const playUrl = msg.video_key ? await (0, storage_1.getPlaybackUrl)(msg.video_key, 3600) : null;
        res.json({ playUrl });
    }
    catch (err) {
        console.error("[messages] GET /:id/play", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /messages/:id/deliver — manually trigger delivery
router.post("/:id/deliver", async (req, res) => {
    try {
        const userId = req.userId;
        const msg = await (0, pool_1.queryOne)("SELECT * FROM milestone_messages WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
        if (!msg) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        if (!msg.is_recorded) {
            res.status(400).json({ error: "Message not yet recorded" });
            return;
        }
        const { deliverMessage } = await Promise.resolve().then(() => __importStar(require("../services/delivery")));
        await deliverMessage(msg);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[messages] POST /:id/deliver", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /messages/watch/:token — public endpoint for recipient (no auth)
router.get("/watch/:token", async (req, res) => {
    try {
        const msg = await (0, pool_1.queryOne)("SELECT * FROM milestone_messages WHERE delivery_token = $1 AND is_delivered = TRUE", [req.params.token]);
        if (!msg) {
            res.status(404).json({ error: "Not found or not delivered" });
            return;
        }
        const playUrl = msg.video_key ? await (0, storage_1.getPlaybackUrl)(msg.video_key, 86400) : null;
        const sender = await (0, pool_1.queryOne)("SELECT name FROM users WHERE id = $1", [msg.user_id]);
        res.json({
            title: msg.title,
            senderName: sender?.name ?? "Someone who loves you",
            playUrl,
            textContent: msg.text_content,
            deliveredAt: msg.delivered_at,
        });
    }
    catch (err) {
        console.error("[messages] GET /watch/:token", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
