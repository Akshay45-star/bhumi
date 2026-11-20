/**
 * /api/documents
 * Upload, list, and delete user documents (will, insurance, deeds, etc.)
 * Files stored in Cloudflare R2 under documents/:userId/:uuid-filename
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { uploadBuffer, getSignedPlayUrl } from "../services/storage";
import { v4 as uuidv4 } from "uuid";

const DOC_TYPES = ["will", "insurance", "deed", "trust", "medical", "financial", "identification", "funeral", "other"] as const;

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^(application\/pdf|image\/(jpeg|jpg|png|webp)|application\/msword|application\/vnd\.openxmlformats)/.test(file.mimetype);
    cb(null, ok);
  },
});

// ─── GET /documents — list user's documents ───────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const docs = await query<any>(
      "SELECT * FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    // Attach a short-lived signed view URL for each document so the app can preview
    const docsWithUrls = await Promise.all(docs.map(async (doc: any) => {
      try {
        const view_url = doc.file_key ? await getSignedPlayUrl(doc.file_key) : null;
        return { ...doc, view_url };
      } catch {
        return { ...doc, view_url: null };
      }
    }));
    res.json({ documents: docsWithUrls });
  } catch (err) {
    console.error("[documents] GET /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /documents — upload a document ─────────────────────────────────────
router.post(
  "/",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const docTypeResult = z.enum(DOC_TYPES).safeParse(req.body.docType ?? "other");
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
      const userId  = (req as any).userId;
      const ext     = req.file.originalname.split(".").pop() ?? "pdf";
      const fileKey = `documents/${userId}/${uuidv4()}.${ext}`;

      await uploadBuffer(fileKey, req.file.buffer, req.file.mimetype);

      const doc = await queryOne<any>(
        `INSERT INTO user_documents (user_id, name, doc_type, file_key, size_bytes, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, req.file.originalname, docType, fileKey, req.file.size, req.file.mimetype]
      );

      res.status(201).json({ document: doc });
    } catch (err) {
      console.error("[documents] POST /", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── GET /documents/:id/download — signed download URL ───────────────────────
router.get("/:id/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const doc = await queryOne<any>(
      "SELECT * FROM user_documents WHERE id = $1 AND user_id = $2",
      [req.params.id, userId]
    );
    if (!doc) { res.status(404).json({ error: "Not found" }); return; }
    const url = await getSignedPlayUrl(doc.file_key);
    res.json({ url });
  } catch (err) {
    console.error("[documents] GET /:id/download", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /documents/:id ────────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const doc = await queryOne<any>(
      "DELETE FROM user_documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, userId]
    );
    if (!doc) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[documents] DELETE /:id", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /documents/export — data export manifest (for trust/GDPR) ────────────
router.get("/export", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [user, checkins, messages, assets, docs, letters] = await Promise.all([
      queryOne<any>("SELECT id,name,phone,email,created_at FROM users WHERE id=$1", [userId]),
      query<any>("SELECT id,prompt,day_number,duration,created_at FROM checkins WHERE user_id=$1 ORDER BY created_at DESC", [userId]),
      query<any>("SELECT id,title,trigger_type,recipient_name,is_recorded,created_at FROM milestone_messages WHERE user_id=$1", [userId]),
      query<any>("SELECT id,name,type,value_cents,institution,created_at FROM assets WHERE user_id=$1", [userId]),
      query<any>("SELECT id,name,doc_type,size_bytes,created_at FROM user_documents WHERE user_id=$1", [userId]),
      query<any>("SELECT id,title,created_at FROM legacy_letters WHERE user_id=$1", [userId]),
    ]);

    res.json({
      exported_at:  new Date().toISOString(),
      user,
      summary: {
        checkin_count:  checkins.length,
        message_count:  messages.length,
        asset_count:    assets.length,
        document_count: docs.length,
        letter_count:   letters.length,
      },
      checkins,
      messages,
      assets,
      documents: docs,
      letters,
      note: "Video files are not included in this manifest. To download your videos, open each check-in in the app and use the share button.",
    });
  } catch (err) {
    console.error("[documents] GET /export", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
