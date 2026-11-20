import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/** Escape user-controlled strings before inserting into HTML email bodies. */
function he(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Using SendGrid via SMTP (or swap for @sendgrid/mail)
const transporter = nodemailer.createTransport({
  host:   "smtp.sendgrid.net",
  port:   465,
  secure: true,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY!,
  },
});

const FROM = `"${process.env.SENDGRID_FROM_NAME}" <${process.env.SENDGRID_FROM_EMAIL}>`;

// Generic transactional email (used for account recovery etc.)
export async function sendEmail(
  to:      string,
  name:    string,
  subject: string,
  html:    string
): Promise<void> {
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendDeliveryEmail(
  recipientEmail: string,
  recipientName:  string,
  senderName:     string,
  messageTitle:   string,
  watchUrl:       string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>A message from ${he(senderName)}</title></head>
<body style="font-family: -apple-system, sans-serif; background: #1A0F0A; color: #FAE8D8; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
  <div style="text-align:center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #C4773B, #D4A017); border-radius: 18px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 32px;">🌱</span>
    </div>
    <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #FAE8D8;">Bhumi</h1>
  </div>

  <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 28px; border: 1px solid rgba(196,119,59,0.2); margin-bottom: 24px;">
    <p style="color: #9C8070; font-size: 13px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">A message left for you</p>
    <h2 style="font-size: 22px; font-weight: 800; color: #FAE8D8; margin: 0 0 8px;">${he(messageTitle)}</h2>
    <p style="color: #9C8070; margin: 0;">From <strong style="color: #FAE8D8;">${he(senderName)}</strong>, recorded just for you.</p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${watchUrl}" style="display: inline-block; background: linear-gradient(90deg, #C4773B, #D4A017); color: #FAF7F2; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 12px;">
      Watch ${he(senderName)}'s Message →
    </a>
  </div>

  <p style="color: #6B5344; font-size: 12px; text-align: center; line-height: 1.6;">
    This link expires in 30 days. Your privacy is protected — only you can access this link.<br>
    <a href="${process.env.APP_URL}" style="color: #C4773B;">bhumi.app</a>
  </p>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    to:      recipientEmail,
    subject: `${he(senderName)} left you a message: "${he(messageTitle)}"`,
    html,
  });
}

export async function sendNudgeEmail(
  recipientEmail: string,
  recipientName:  string,
  senderName:     string,
  messageTitle:   string,
  appUrl:         string
): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      recipientEmail,
    subject: `${he(senderName)} left you a message in Bhumi`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>A message from ${he(senderName)}</title></head>
<body style="font-family: -apple-system, sans-serif; background: #1A0F0A; color: #FAE8D8; padding: 40px 20px; max-width: 600px; margin: 0 auto;">
  <div style="text-align:center; margin-bottom: 32px;">
    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #C4773B, #D4A017); border-radius: 18px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 32px;">🌱</span>
    </div>
    <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #FAE8D8;">Bhumi</h1>
  </div>

  <div style="background: rgba(255,255,255,0.04); border-radius: 16px; padding: 28px; border: 1px solid rgba(196,119,59,0.2); margin-bottom: 24px;">
    <p style="color: #9C8070; font-size: 13px; margin: 0 0 8px; letter-spacing: 2px; text-transform: uppercase;">A message left for you</p>
    <h2 style="font-size: 22px; font-weight: 800; color: #FAE8D8; margin: 0 0 8px;">${he(messageTitle)}</h2>
    <p style="color: #9C8070; margin: 0;">From <strong style="color: #FAE8D8;">${he(senderName)}</strong>, recorded just for you.</p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${appUrl}" style="display: inline-block; background: linear-gradient(90deg, #C4773B, #D4A017); color: #FAF7F2; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 12px;">
      Open Bhumi to Watch →
    </a>
  </div>

  <p style="color: #6B5344; font-size: 12px; text-align: center; line-height: 1.6;">
    Open the Bhumi app on your phone to watch this message privately.<br>
    <a href="${appUrl}" style="color: #C4773B;">bhumi.app</a>
  </p>
</body>
</html>`,
  });
}

export async function sendInviteEmail(
  recipientEmail: string,
  recipientName:  string,
  inviterName:    string,
  inviteUrl:      string
): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      recipientEmail,
    subject: `${he(inviterName)} invited you to Bhumi`,
    html: `
<p>Hi ${he(recipientName)},</p>
<p>${he(inviterName)} has added you as a family member on Bhumi — a place where people record messages for the people they love most.</p>
<p><a href="${inviteUrl}" style="background:#C4773B; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Accept ${he(inviterName)}'s invitation</a></p>
<p style="color:#999; font-size:12px;">This invite expires in 30 days. If you didn't expect this, you can safely ignore it.</p>
    `,
  });
}

export async function sendTrustedContactEmail(
  contactEmail: string,
  contactName:  string,
  userName:     string,
  confirmUrl:   string
): Promise<void> {
  await transporter.sendMail({
    from:    FROM,
    to:      contactEmail,
    subject: `${he(userName)} hasn't checked in — please confirm`,
    html: `
<p>Hi ${he(contactName)},</p>
<p>${he(userName)} hasn't recorded a Bhumi check-in in 30 days. As their trusted contact, we're reaching out to confirm their status before any legacy messages are delivered to their family.</p>
<p><a href="${confirmUrl}" style="background:#C4773B; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">Confirm ${he(userName)} is okay</a></p>
<p style="color:#999; font-size:12px;">If you don't respond within 7 days, no messages will be sent. You can also reply STOP to opt out of future notifications.</p>
    `,
  });
}
