import { Router, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { deliverMessage } from "../services/delivery";

const router = Router();

// ─── HMAC helpers ─────────────────────────────────────────────────────────────
// The confirm URL includes a sig= query param derived from HMAC-SHA256(pingId, JWT_SECRET).
// This prevents an unauthenticated attacker from brute-forcing a UUIDv4 pingId and
// triggering delivery with ?alive=false.
function signPingId(pingId: string): string {
  return createHmac("sha256", process.env.JWT_SECRET ?? "")
    .update(pingId)
    .digest("hex")
    .slice(0, 32); // first 32 hex chars = 128-bit security
}

function verifyPingSig(pingId: string, sig: string): boolean {
  const expected = Buffer.from(signPingId(pingId));
  const given    = Buffer.from(sig.padEnd(expected.length, " ").slice(0, expected.length));
  try { return timingSafeEqual(expected, given); } catch { return false; }
}

// ─── Public helper used by cron to build confirm URLs ────────────────────────
export function buildConfirmUrl(pingId: string): string {
  const sig = signPingId(pingId);
  return `${process.env.APP_URL}/api/deadman/confirm/${pingId}?alive=true&sig=${sig}`;
}

// POST /deadman/confirm/:pingId — trusted contact confirms user is alive or triggers delivery
// Public endpoint (no auth — linked in SMS) but HMAC-signed
router.get("/confirm/:pingId", async (req: Request, res: Response) => {
  const { pingId } = req.params;
  const alive = req.query.alive === "true";
  const sig   = String(req.query.sig ?? "");

  // Verify the HMAC signature — prevents brute-force UUID + alive=false attack
  if (!verifyPingSig(pingId, sig)) {
    res.status(403).send("Invalid or missing confirmation signature.");
    return;
  }

  try {
    const ping = await queryOne<any>(
      "SELECT * FROM deadman_pings WHERE id = $1 AND status = 'pending'",
      [pingId]
    );

    if (!ping) {
      res.status(404).send("This confirmation link has already been used or has expired.");
      return;
    }

    if (ping.expires_at < new Date()) {
      await query("UPDATE deadman_pings SET status = 'expired' WHERE id = $1", [pingId]);
      res.status(410).send("This confirmation link has expired.");
      return;
    }

    if (alive) {
      // User is fine — cancel the ping
      await query(
        "UPDATE deadman_pings SET status = 'alive', responded_at = NOW() WHERE id = $1",
        [pingId]
      );
      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#1A0F0A;color:#FAE8D8">
          <h1>✓ Confirmed</h1>
          <p>Thank you. No messages will be sent. We'll check in again in 30 days.</p>
        </body></html>
      `);
    } else {
      // Trigger delivery
      await query(
        "UPDATE deadman_pings SET status = 'triggered', responded_at = NOW() WHERE id = $1",
        [pingId]
      );
      const messages = await query<any>(
        "SELECT * FROM milestone_messages WHERE user_id = $1 AND is_recorded = TRUE AND is_delivered = FALSE",
        [ping.user_id]
      );
      for (const msg of messages) {
        await deliverMessage(msg).catch(console.error);
      }
      res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#1A0F0A;color:#FAE8D8">
          <h1>Messages delivered</h1>
          <p>Their legacy messages have been sent to their family. Thank you for being there for them.</p>
        </body></html>
      `);
    }
  } catch (err) {
    console.error("[deadman] GET /confirm/:pingId", err);
    res.status(500).send("An error occurred. Please try again later.");
  }
});

// POST /deadman/trusted-contact — save trusted contact
router.post("/trusted-contact", requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    name:  z.string().min(1).max(100).trim(),
    phone: z.string().max(25).optional(),
    email: z.string().email().max(200).optional(),
  }).refine((d) => d.phone || d.email, { message: "Phone or email required" });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  try {
    const userId = (req as any).userId;
    const { name, phone, email } = result.data;

    // Replace existing trusted contact
    await query("DELETE FROM trusted_contacts WHERE user_id = $1", [userId]);
    const contact = await queryOne(
      "INSERT INTO trusted_contacts (user_id, name, phone, email) VALUES ($1,$2,$3,$4) RETURNING *",
      [userId, name, phone ?? null, email ?? null]
    );
    res.status(201).json({ contact });
  } catch (err) {
    console.error("[deadman] POST /trusted-contact", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
