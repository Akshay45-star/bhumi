import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { getUploadPresignedUrl, getPlaybackUrl } from "../services/storage";

const router = Router();
router.use(requireAuth);

// GET /messages
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const messages = await query(
      "SELECT * FROM milestone_messages WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ messages });
  } catch (err) {
    console.error("[messages] GET /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages — create milestone message
router.post("/", async (req: Request, res: Response) => {
  const schema = z.object({
    title:               z.string().min(1).max(200),
    recipientName:       z.string().min(1).max(200),
    recipientPhone:      z.string().max(25).optional(),
    recipientEmail:      z.string().email().max(200).optional(),
    recipientConnectionId: z.string().uuid().optional(),
    triggerType:         z.enum(["life_event", "date", "deadman", "manual", "recipient"]),
    triggerEventKey:     z.string().max(100).optional(),
    triggerDate:         z.string().max(30).optional(),
    unlockAfterDays:     z.number().int().min(1).max(3650).optional(), // deadman: days of inactivity
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  try {
    const userId = (req as any).userId;
    const { title, recipientName, recipientPhone, recipientEmail, recipientConnectionId, triggerType, triggerEventKey, triggerDate, unlockAfterDays } = result.data;

    const msg = await queryOne(
      `INSERT INTO milestone_messages
        (user_id, title, recipient_name, recipient_phone, recipient_email,
         recipient_connection_id, trigger_type, trigger_event_key, trigger_date, unlock_after_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [userId, title, recipientName, recipientPhone ?? null, recipientEmail ?? null,
       recipientConnectionId ?? null, triggerType, triggerEventKey ?? null, triggerDate ?? null,
       triggerType === "deadman" ? (unlockAfterDays ?? 30) : null]
    );
    res.status(201).json({ message: msg });
  } catch (err) {
    console.error("[messages] POST /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/upload-url
router.post("/:id/upload-url", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const msg = await queryOne("SELECT id, user_id FROM milestone_messages WHERE id = $1", [req.params.id]);
    if (!msg || (msg as any).user_id !== userId) { res.status(404).json({ error: "Not found" }); return; }

    const { uploadUrl, key } = await getUploadPresignedUrl(userId, "message");
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error("[messages] POST /:id/upload-url", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /messages/:id/record — mark as recorded after upload
router.patch("/:id/record", async (req: Request, res: Response) => {
  const schema = z.object({ videoKey: z.string().min(1).max(500) });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "videoKey required" }); return; }

  try {
    const userId = (req as any).userId;
    const msg = await queryOne(
      "UPDATE milestone_messages SET video_key = $1, is_recorded = TRUE WHERE id = $2 AND user_id = $3 RETURNING *",
      [result.data.videoKey, req.params.id, userId]
    );
    if (!msg) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ message: msg });
  } catch (err) {
    console.error("[messages] PATCH /:id/record", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /messages/:id/play — creator previews their own recorded message
router.get("/:id/play", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const msg = await queryOne<any>(
      "SELECT * FROM milestone_messages WHERE id = $1 AND user_id = $2",
      [req.params.id, userId]
    );
    if (!msg) { res.status(404).json({ error: "Not found" }); return; }
    const playUrl = msg.video_key ? await getPlaybackUrl(msg.video_key, 3600) : null;
    res.json({ playUrl });
  } catch (err) {
    console.error("[messages] GET /:id/play", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages/:id/deliver — manually trigger delivery
router.post("/:id/deliver", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const msg = await queryOne<any>(
      "SELECT * FROM milestone_messages WHERE id = $1 AND user_id = $2",
      [req.params.id, userId]
    );
    if (!msg) { res.status(404).json({ error: "Not found" }); return; }
    if (!msg.is_recorded) { res.status(400).json({ error: "Message not yet recorded" }); return; }

    const { deliverMessage } = await import("../services/delivery");
    await deliverMessage(msg);
    res.json({ ok: true });
  } catch (err) {
    console.error("[messages] POST /:id/deliver", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /messages/watch/:token — public endpoint for recipient (no auth)
router.get("/watch/:token", async (req: Request, res: Response) => {
  try {
    const msg = await queryOne<any>(
      "SELECT * FROM milestone_messages WHERE delivery_token = $1 AND is_delivered = TRUE",
      [req.params.token]
    );
    if (!msg) { res.status(404).json({ error: "Not found or not delivered" }); return; }
    const playUrl = msg.video_key ? await getPlaybackUrl(msg.video_key, 86400) : null;

    const sender = await queryOne<any>("SELECT name FROM users WHERE id = $1", [msg.user_id]);
    res.json({
      title:       msg.title,
      senderName:  sender?.name ?? "Someone who loves you",
      playUrl,
      textContent: msg.text_content,
      deliveredAt: msg.delivered_at,
    });
  } catch (err) {
    console.error("[messages] GET /watch/:token", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
