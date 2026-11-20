import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Streak freeze — spend one freeze to skip today's streak requirement
router.post("/me/streak-freeze", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user   = await queryOne<any>(
    "SELECT streak_freezes_remaining FROM users WHERE id = $1",
    [userId]
  );
  if (!user || user.streak_freezes_remaining <= 0) {
    res.status(400).json({ error: "No streak freezes remaining" });
    return;
  }
  await query(
    `UPDATE users
     SET streak_freezes_remaining = streak_freezes_remaining - 1,
         last_checkin_at           = NOW(),
         updated_at                = NOW()
     WHERE id = $1`,
    [userId]
  );
  const updated = await queryOne<any>(
    "SELECT streak_freezes_remaining FROM users WHERE id = $1",
    [userId]
  );
  res.json({ ok: true, remaining: updated?.streak_freezes_remaining ?? 0 });
});

// Grant Pro streak freezes (called by RevenueCat webhook or after purchase restore)
// Hard cap at 30 to prevent manipulation of the count field
router.post("/me/grant-freezes", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const rawCount = Number(req.body.count ?? 3);
  const count = Math.max(0, Math.min(rawCount, 30)); // clamp 0–30
  await query(
    "UPDATE users SET streak_freezes_remaining = $2, updated_at = NOW() WHERE id = $1",
    [userId, count]
  );
  res.json({ ok: true, granted: count });
});

router.get("/me", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await queryOne(
    "SELECT id,name,phone,email,is_pro,streak,total_days,last_checkin_at,recording_for,concern,created_at FROM users WHERE id=$1",
    [userId]
  );
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user });
});

router.patch("/me", async (req: Request, res: Response) => {
  // Validate and bound every writable field — prevents data poisoning via oversized strings
  const schema = z.object({
    name:          z.string().min(1).max(100).optional(),
    email:         z.string().email().max(200).optional(),
    recording_for: z.array(z.string().max(100)).max(20).optional(),
    concern:       z.string().max(500).optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const userId = (req as any).userId;
  const allowed = ["name","email","recording_for","concern"] as const;
  const updates = Object.fromEntries(
    Object.entries(result.data).filter(([k]) => allowed.includes(k as any) && result.data[k as keyof typeof result.data] !== undefined)
  );
  if (!Object.keys(updates).length) { res.status(400).json({ error: "No valid fields" }); return; }

  try {
    const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`).join(", ");
    const user = await queryOne(
      `UPDATE users SET ${setClauses}, updated_at=NOW() WHERE id=$1 RETURNING id,name,phone,email,is_pro,streak,total_days`,
      [userId, ...Object.values(updates)]
    );
    res.json({ user });
  } catch (err) {
    console.error("[USERS PATCH]", err);
    res.status(500).json({ error: "Update failed." });
  }
});

router.get("/me/notification-prefs", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const prefs  = await queryOne("SELECT * FROM notification_prefs WHERE user_id=$1",[userId]);
  res.json({ prefs: prefs ?? { reminder_enabled:true, reminder_hour:20, reminder_minute:0, streak_alerts:true } });
});

router.patch("/me/notification-prefs", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { reminderEnabled=true, reminderHour=20, reminderMinute=0, streakAlerts=true, milestoneAlerts=true } = req.body;
  const prefs = await queryOne(
    `INSERT INTO notification_prefs (user_id,reminder_enabled,reminder_hour,reminder_minute,streak_alerts,milestone_alerts)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE
     SET reminder_enabled=EXCLUDED.reminder_enabled, reminder_hour=EXCLUDED.reminder_hour,
         reminder_minute=EXCLUDED.reminder_minute,   streak_alerts=EXCLUDED.streak_alerts,
         milestone_alerts=EXCLUDED.milestone_alerts, updated_at=NOW()
     RETURNING *`,
    [userId,reminderEnabled,reminderHour,reminderMinute,streakAlerts,milestoneAlerts]
  );
  res.json({ prefs });
});

// Register / update Expo push token
router.put("/me/push-token", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { token } = req.body;
  // Expo push tokens are exactly "ExponentPushToken[xxxx]" — enforce format + length
  if (!token || typeof token !== "string" || token.length > 200 || !token.startsWith("ExponentPushToken")) {
    res.status(400).json({ error: "Invalid push token format" });
    return;
  }
  try {
    await query("UPDATE users SET push_token=$2, updated_at=NOW() WHERE id=$1", [userId, token]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[PUSH-TOKEN]", err);
    res.status(500).json({ error: "Failed to register token." });
  }
});

router.delete("/me", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  try {
    // ON DELETE CASCADE on all child tables handles checkins, messages, assets,
    // letters, documents, family_connections, trusted_contacts, deadman_pings, otp_codes
    await query("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ ok: true, message: "Account and all data permanently deleted." });
  } catch (err) {
    console.error("[users] DELETE /me", err);
    res.status(500).json({ error: "Failed to delete account. Please try again." });
  }
});

export default router;
