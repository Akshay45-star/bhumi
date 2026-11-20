import { randomInt } from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Generate a cryptographically secure 6-digit OTP
export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

// Send OTP — uses Twilio if configured, otherwise logs to console (dev/staging)
export async function sendOTP(phone: string, code: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    // No Twilio credentials — log OTP so it can be used during testing
    console.log(`[OTP] Code for ${phone}: ${code}  (Twilio not configured — check Railway logs)`);
    return;
  }

  // Lazy-load Twilio only when credentials are available
  const twilio = await import("twilio");
  const client = twilio.default(sid, token);
  await client.messages.create({
    body: `Your Bhumi verification code is: ${code}. Valid for 10 minutes.`,
    from,
    to: phone,
  });
}

// Send invite SMS — no-op if Twilio not configured
export async function sendInviteSMS(
  phone:       string,
  creatorName: string,
  memberName:  string,
  inviteUrl:   string
): Promise<string> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.log(`[SMS] Invite for ${phone} — Twilio not configured`);
    return "no-sid";
  }
  const twilio = await import("twilio");
  const client = twilio.default(sid, token);
  const msg = await client.messages.create({
    body: `Hi ${memberName}, ${creatorName} has left you messages on Bhumi. Accept here: ${inviteUrl}`,
    from,
    to: phone,
  });
  return msg.sid;
}

// Trusted contact ping — no-op if Twilio not configured
export async function sendTrustedContactPing(
  contactPhone: string,
  userName:     string,
  confirmUrl:   string
): Promise<string> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.log(`[SMS] Trusted contact ping for ${contactPhone} — Twilio not configured`);
    return "no-sid";
  }
  const twilio = await import("twilio");
  const client = twilio.default(sid, token);
  const msg = await client.messages.create({
    body: `Hi, this is Bhumi. ${userName} hasn't checked in. Please confirm: ${confirmUrl}`,
    from,
    to: contactPhone,
  });
  return msg.sid;
}

// Delivery SMS — no-op if Twilio not configured
export async function sendDeliverySMS(
  recipientPhone: string,
  senderName:     string,
  messageTitle:   string,
  watchUrl:       string
): Promise<string> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.log(`[SMS] Delivery SMS for ${recipientPhone} — Twilio not configured`);
    return "no-sid";
  }
  const twilio = await import("twilio");
  const client = twilio.default(sid, token);
  const msg = await client.messages.create({
    body: `${senderName} left you a message: "${messageTitle}". Watch: ${watchUrl}`,
    from,
    to: recipientPhone,
  });
  return msg.sid;
}
