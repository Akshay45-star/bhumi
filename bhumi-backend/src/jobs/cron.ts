import cron from "node-cron";
import { query, queryOne, pool } from "../db/pool";
import { deliverMessage } from "../services/delivery";
import { sendTrustedContactEmail } from "../services/email";
import { buildConfirmUrl } from "../routes/deadman";

// ─── Distributed advisory lock ────────────────────────────────────────────────
async function withAdvisoryLock(lockId: number, fn: () => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT pg_try_advisory_lock($1)", [lockId]);
    if (!rows[0]?.pg_try_advisory_lock) return;
    try {
      await fn();
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [lockId]);
    }
  } finally {
    client.release();
  }
}

// ─── Helper: send Expo push to a user ────────────────────────────────────────
async function pushNotify(userId: string, title: string, body: string): Promise<void> {
  const user = await queryOne<any>("SELECT push_token FROM users WHERE id = $1", [userId]);
  if (!user?.push_token?.startsWith("ExponentPushToken")) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ to: user.push_token, title, body, sound: "default" }),
  }).catch(console.error);
}

// ─── 1. Date-triggered message delivery ──────────────────────────────────────
// Runs every day at 9:00 AM UTC
export function startDateTriggerJob(): void {
  cron.schedule("0 9 * * *", () => withAdvisoryLock(1001, async () => {
    console.log("[CRON] Running date-trigger delivery job");
    try {
      const messages = await query<any>(
        `SELECT * FROM milestone_messages
         WHERE trigger_type = 'date'
           AND trigger_date <= CURRENT_DATE
           AND is_recorded = TRUE
           AND is_delivered = FALSE`
      );
      for (const msg of messages) {
        await deliverMessage(msg).catch(console.error);
      }
      if (messages.length) console.log(`[CRON] Date-triggered: delivered ${messages.length} messages`);
    } catch (e) {
      console.error("[CRON] Date trigger job error:", e);
    }
  }));
}

// ─── 2a. Deadman warning — notify creator at 80% of inactivity window ────────
// Runs daily at 8:00 AM UTC
// If someone set 30 days, they get a push at day 24 saying "you haven't checked in"
// This is the primary legal protection — gives creator a chance to check in before unlock
export function startDeadmanWarningJob(): void {
  cron.schedule("0 8 * * *", () => withAdvisoryLock(1004, async () => {
    try {
      // Find users with undelivered deadman messages who are at 80% of their window
      // but have NOT yet been warned in the last unlock_after_days * 0.8 period
      const rows = await query<any>(
        `SELECT DISTINCT ON (mm.user_id)
                mm.user_id,
                mm.unlock_after_days,
                u.last_checkin_at,
                u.name AS user_name
         FROM milestone_messages mm
         JOIN users u ON u.id = mm.user_id
         WHERE mm.trigger_type = 'deadman'
           AND mm.is_recorded = TRUE
           AND mm.is_unlocked = FALSE
           AND u.last_checkin_at IS NOT NULL
           AND u.last_checkin_at < NOW() - (mm.unlock_after_days * 0.8 || ' days')::INTERVAL
           AND u.last_checkin_at > NOW() - (mm.unlock_after_days || ' days')::INTERVAL
           AND NOT EXISTS (
             SELECT 1 FROM deadman_warnings dw
             WHERE dw.user_id = mm.user_id
               AND dw.warned_at > NOW() - (mm.unlock_after_days || ' days')::INTERVAL
           )`
      );

      for (const row of rows) {
        const daysLeft = Math.ceil(
          row.unlock_after_days -
          (Date.now() - new Date(row.last_checkin_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        // Push notification to creator
        await pushNotify(
          row.user_id,
          "⚠️ Your messages will unlock soon",
          `You haven't checked in for a while. Open Bhumi to keep your messages locked (${daysLeft} days left).`
        );

        // Log the warning so we don't spam
        await query(
          "INSERT INTO deadman_warnings (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
          [row.user_id]
        );

        console.log(`[CRON] Deadman warning sent to user ${row.user_id} (${daysLeft} days until unlock)`);
      }
    } catch (e) {
      console.error("[CRON] Deadman warning job error:", e);
    }
  }));
}

// ─── 2b. Deadman time-lock delivery ──────────────────────────────────────────
// Runs every day at 10:00 AM UTC
// Only fires AFTER the full unlock_after_days has elapsed.
// The warning job at 80% gives creators a chance to check in before this fires.
export function startDeadmanJob(): void {
  cron.schedule("0 10 * * *", () => withAdvisoryLock(1002, async () => {
    console.log("[CRON] Running deadman time-lock delivery");
    try {
      const messages = await query<any>(
        `SELECT mm.*, u.name AS creator_name, u.last_checkin_at, u.email AS creator_email
         FROM milestone_messages mm
         JOIN users u ON u.id = mm.user_id
         WHERE mm.trigger_type = 'deadman'
           AND mm.is_recorded = TRUE
           AND mm.is_unlocked = FALSE
           AND u.last_checkin_at IS NOT NULL
           AND u.last_checkin_at < NOW() - (mm.unlock_after_days || ' days')::INTERVAL`
      );

      for (const msg of messages) {
        // Mark unlocked
        await query(
          `UPDATE milestone_messages
           SET is_unlocked = TRUE, unlocked_at = NOW(), unlocked_by = 'deadman'
           WHERE id = $1`,
          [msg.id]
        );

        // Deliver — deliverMessage resolves the email address itself:
        // from recipient_email (manual) or from family_connections → users.email (app member)
        await deliverMessage(msg).catch(console.error);

        // Notify trusted contact via email (courtesy — not a gate)
        const contact = await queryOne<any>(
          "SELECT * FROM trusted_contacts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
          [msg.user_id]
        );
        if (contact?.email && !await hadRecentPing(msg.user_id)) {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const ping = await queryOne<any>(
            "INSERT INTO deadman_pings (user_id, contact_id, expires_at) VALUES ($1,$2,$3) RETURNING *",
            [msg.user_id, contact.id, expiresAt]
          );
          const confirmUrl = buildConfirmUrl(ping!.id);
          await sendTrustedContactEmail(
            contact.email,
            contact.name,
            msg.creator_name ?? "Your loved one",
            confirmUrl
          ).catch(console.error);
        }

        console.log(`[CRON] Deadman unlocked: "${msg.title}" for user ${msg.user_id}`);
      }
    } catch (e) {
      console.error("[CRON] Deadman delivery job error:", e);
    }
  }));
}

async function hadRecentPing(userId: string): Promise<boolean> {
  const row = await queryOne<any>(
    "SELECT id FROM deadman_pings WHERE user_id = $1 AND pinged_at > NOW() - INTERVAL '7 days' LIMIT 1",
    [userId]
  );
  return !!row;
}

// ─── 3. Expire old deadman pings ─────────────────────────────────────────────
export function startDeadmanExpireJob(): void {
  cron.schedule("0 * * * *", () => withAdvisoryLock(1003, async () => {
    try {
      await query(
        "UPDATE deadman_pings SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW()"
      );
    } catch (e) {
      console.error("[CRON] Deadman expire job error:", e);
    }
  }));
}

// ─── 4. OTP cleanup ──────────────────────────────────────────────────────────
// Runs daily at 3:00 AM UTC — deletes used and expired OTPs older than 24 hours
export function startOtpCleanupJob(): void {
  cron.schedule("0 3 * * *", () => withAdvisoryLock(1005, async () => {
    try {
      const { rowCount } = await pool.query(
        "DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '24 hours'"
      );
      if (rowCount) console.log(`[CRON] OTP cleanup: deleted ${rowCount} expired codes`);
    } catch (e) {
      console.error("[CRON] OTP cleanup error:", e);
    }
  }));
}

export function startAllJobs(): void {
  startDateTriggerJob();
  startDeadmanWarningJob();
  startDeadmanJob();
  startDeadmanExpireJob();
  startOtpCleanupJob();
  console.log("[CRON] All jobs started");
}
