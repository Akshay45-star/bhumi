import { query, queryOne } from "../db/pool";
import { sendDeliveryEmail, sendNudgeEmail } from "./email";

export interface MilestoneMessage {
  id:                       string;
  user_id:                  string;
  title:                    string;
  recipient_name:           string;
  recipient_email?:         string;   // set if creator typed it manually (off-app)
  recipient_connection_id?: string;   // set if recipient is a connected family member
  video_key?:               string;
  delivery_token:           string;
}

/**
 * Delivery priority:
 *   1. Push notification to recipient's Expo push token  (if they have the app)
 *   2. Email nudge — "open Bhumi to watch"               (if they have the app + email)
 *   3. Email with web player link                        (only if they DON'T have the app)
 *
 * The web player link is the last resort — Bhumi-to-Bhumi is always preferred.
 */
export async function deliverMessage(msg: MilestoneMessage): Promise<void> {
  // ── 1. Resolve sender name ─────────────────────────────────────────────────
  const sender = await queryOne<{ name: string }>(
    "SELECT name FROM users WHERE id = $1",
    [msg.user_id]
  );
  const senderName = sender?.name ?? "Someone who loves you";

  // ── 2. Resolve recipient details ───────────────────────────────────────────
  // For connected family members, look up their account (push token + email).
  // For manual (off-app) recipients, use what the creator typed.
  let recipientPushToken: string | null = null;
  let recipientEmail:     string | null = msg.recipient_email ?? null;
  let recipientName:      string        = msg.recipient_name;
  let hasAppAccount                     = false;

  if (msg.recipient_connection_id) {
    const connection = await queryOne<any>(
      `SELECT fc.invite_name,
              fc.invite_email,
              u.name       AS member_name,
              u.email      AS member_email,
              u.push_token AS member_push_token
       FROM family_connections fc
       LEFT JOIN users u ON u.id = fc.member_id
       WHERE fc.id = $1`,
      [msg.recipient_connection_id]
    );
    if (connection) {
      hasAppAccount      = !!connection.member_name; // member_id is set = they have an account
      recipientName      = connection.member_name  ?? connection.invite_name  ?? recipientName;
      recipientEmail     = connection.member_email ?? connection.invite_email ?? recipientEmail;
      recipientPushToken = connection.member_push_token ?? null;
    }
  }

  // ── 3. Mark delivered before sending (idempotent) ──────────────────────────
  await query(
    "UPDATE milestone_messages SET is_delivered = TRUE, delivered_at = NOW() WHERE id = $1",
    [msg.id]
  );

  // ── 4. Push notification (primary — instant, no link needed) ───────────────
  if (recipientPushToken && recipientPushToken.startsWith("ExponentPushToken")) {
    await sendPushNotification(
      recipientPushToken,
      `💌 ${senderName} left you a message`,
      `"${msg.title}" — open Bhumi to watch it.`
    ).catch((err) => console.error("[delivery] Push failed:", err));
  }

  // ── 5. Email ────────────────────────────────────────────────────────────────
  if (recipientEmail) {
    if (hasAppAccount) {
      // They have the app — send a nudge only (no video link, no web player)
      const appUrl = process.env.APP_URL ?? "https://bhumi.app";
      await sendNudgeEmail(recipientEmail, recipientName, senderName, msg.title, appUrl)
        .then(() => logDelivery(msg.id, "email", recipientEmail!, "sent"))
        .catch((err) => {
          console.error("[delivery] Nudge email failed:", err);
          return logDelivery(msg.id, "email", recipientEmail!, "failed");
        });
    } else {
      // No app account — send email with the full web player link (fallback only)
      const watchUrl = `${process.env.WEB_PLAYER_URL}/watch/${msg.delivery_token}`;
      await sendDeliveryEmail(recipientEmail, recipientName, senderName, msg.title, watchUrl)
        .then(() => logDelivery(msg.id, "email", recipientEmail!, "sent"))
        .catch((err) => {
          console.error("[delivery] Delivery email failed:", err);
          return logDelivery(msg.id, "email", recipientEmail!, "failed");
        });
    }
  }

  if (!recipientPushToken && !recipientEmail) {
    // No delivery channel — message is visible in app inbox when they next open Bhumi
    console.log(`[delivery] Message ${msg.id} unlocked — app inbox only (no push token or email)`);
  }
}

// ── Push helper ────────────────────────────────────────────────────────────────
async function sendPushNotification(token: string, title: string, body: string): Promise<void> {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body:    JSON.stringify({ to: token, title, body, sound: "default", priority: "high" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expo push failed (${res.status}): ${text}`);
  }
  const data = await res.json().catch(() => ({ data: null })) as { data?: { status?: string; message?: string } | null };
  // Expo returns per-token errors even on HTTP 200
  const receipt = data?.data;
  if (receipt?.status === "error") {
    console.warn(`[delivery] Push token error for ${token}: ${receipt.message}`);
  }
}

// ── Delivery log ───────────────────────────────────────────────────────────────
async function logDelivery(
  messageId:   string,
  channel:     "sms" | "email",
  recipient:   string,
  status:      "sent" | "failed",
  providerId?: string
): Promise<void> {
  await query(
    "INSERT INTO delivery_log (message_id, channel, recipient, status, provider_id) VALUES ($1,$2,$3,$4,$5)",
    [messageId, channel, recipient, status, providerId ?? null]
  ).catch(console.error);
}
