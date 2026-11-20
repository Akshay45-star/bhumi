"use strict";
/**
 * /api/documents
 * Upload, list, and delete user documents (will, insurance, deeds, etc.)
 * Files stored in Cloudflare R2 under documents/:userId/:uuid-filename
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const storage_1 = require("../services/storage");
const uuid_1 = require("uuid");
const DOC_TYPES = ["will", "insurance", "deed", "trust", "medical", "financial", "identification", "funeral", "other"];
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const ok = /^(application\/pdf|image\/(jpeg|jpg|png|webp)|application\/msword|application\/vnd\.openxmlformats)/.test(file.mimetype);
        cb(null, ok);
    },
});
// ─── GET /documents — list user's documents ───────────────────────────────────
router.get("/", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const docs = await (0, pool_1.query)("SELECT * FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        // Attach a short-lived signed view URL for each document so the app can preview
        const docsWithUrls = await Promise.all(docs.map(async (doc) => {
            try {
                const view_url = doc.file_key ? await (0, storage_1.getSignedPlayUrl)(doc.file_key) : null;
                return { ...doc, view_url };
            }
            catch {
                return { ...doc, view_url: null };
            }
        }));
        res.json({ documents: docsWithUrls });
    }
    catch (err) {
        console.error("[documents] GET /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── POST /documents — upload a document ─────────────────────────────────────
router.post("/", auth_1.requireAuth, upload.single("file"), async (req, res) => {
    const docTypeResult = zod_1.z.enum(DOC_TYPES).safeParse(req.body.docType ?? "other");
    if (!docTypeResult.success) {
        res.status(400).json({ error: "Invalid docType" });
        return;
    }
    const docType = docTypeResult.data;
    if (!req.file) {
        res.status(400).json({ error: "file required" });
        return;
    }
    try {
        const userId = req.userId;
        const ext = req.file.originalname.split(".").pop() ?? "pdf";
        const fileKey = `documents/${userId}/${(0, uuid_1.v4)()}.${ext}`;
        await (0, storage_1.uploadBuffer)(fileKey, req.file.buffer, req.file.mimetype);
        const doc = await (0, pool_1.queryOne)(`INSERT INTO user_documents (user_id, name, doc_type, file_key, size_bytes, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [userId, req.file.originalname, docType, fileKey, req.file.size, req.file.mimetype]);
        res.status(201).json({ document: doc });
    }
    catch (err) {
        console.error("[documents] POST /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── GET /documents/:id/download — signed download URL ───────────────────────
router.get("/:id/download", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const doc = await (0, pool_1.queryOne)("SELECT * FROM user_documents WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
        if (!doc) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const url = await (0, storage_1.getSignedPlayUrl)(doc.file_key);
        res.json({ url });
    }
    catch (err) {
        console.error("[documents] GET /:id/download", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── DELETE /documents/:id ────────────────────────────────────────────────────
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const doc = await (0, pool_1.queryOne)("DELETE FROM user_documents WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, userId]);
        if (!doc) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[documents] DELETE /:id", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ─── GET /documents/export — data export manifest (for trust/GDPR) ────────────
router.get("/export", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const [user, checkins, messages, assets, docs, letters] = await Promise.all([
            (0, pool_1.queryOne)("SELECT id,name,phone,email,created_at FROM users WHERE id=$1", [userId]),
            (0, pool_1.query)("SELECT id,prompt,day_number,duration,created_at FROM checkins WHERE user_id=$1 ORDER BY created_at DESC", [userId]),
            (0, pool_1.query)("SELECT id,title,trigger_type,recipient_name,is_recorded,created_at FROM milestone_messages WHERE user_id=$1", [userId]),
            (0, pool_1.query)("SELECT id,name,type,value_cents,institution,created_at FROM assets WHERE user_id=$1", [userId]),
            (0, pool_1.query)("SELECT id,name,doc_type,size_bytes,created_at FROM user_documents WHERE user_id=$1", [userId]),
            (0, pool_1.query)("SELECT id,title,created_at FROM legacy_letters WHERE user_id=$1", [userId]),
        ]);
        res.json({
            exported_at: new Date().toISOString(),
            user,
            summary: {
                checkin_count: checkins.length,
                message_count: messages.length,
                asset_count: assets.length,
                document_count: docs.length,
                letter_count: letters.length,
            },
            checkins,
            messages,
            assets,
            documents: docs,
            letters,
            note: "Video files are not included in this manifest. To download your videos, open each check-in in the app and use the share button.",
        });
    }
    catch (err) {
        console.error("[documents] GET /export", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
