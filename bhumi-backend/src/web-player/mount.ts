/**
 * Web Player — /watch/:token
 *
 * Public browser page for email recipients who don't have the app.
 * Handles all video failure modes gracefully.
 */

import { Application, Request, Response } from "express";
import { queryOne } from "../db/pool";
import { getPlaybackUrl } from "../services/storage";

export function mountWebPlayer(app: Application): void {

  // ─── GET /watch/:token — HTML web player page ───────────────────────────────
  app.get("/watch/:token", async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const msg = await queryOne<any>(
        `SELECT mm.*, u.name AS sender_name
         FROM milestone_messages mm
         JOIN users u ON u.id = mm.user_id
         WHERE mm.delivery_token = $1
           AND mm.is_delivered = TRUE`,
        [token]
      );

      if (!msg) {
        res.status(404).send(errorPage(
          "Link not found",
          "This link may have expired or already been used. Links are valid for 30 days after delivery.",
          "support@bhumi.app"
        ));
        return;
      }

      // Try to generate a signed playback URL — if R2 is down, show message info anyway
      let playUrl: string | null = null;
      let videoError: string | null = null;

      if (msg.video_key) {
        try {
          playUrl = await getPlaybackUrl(msg.video_key, 86400); // 24 hours
        } catch (err) {
          console.error("[web-player] Failed to generate signed URL:", err);
          videoError = "The video is temporarily unavailable. Please try again in a few minutes.";
        }
      }

      const senderName    = he(msg.sender_name    ?? "Someone who loves you");
      const messageTitle  = he(msg.title          ?? "A message for you");
      const recipientName = he(msg.recipient_name ?? "");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-store"); // never cache — URL is time-limited
      res.send(playerPage({
        senderName,
        messageTitle,
        recipientName,
        playUrl,
        videoError,
        refreshToken: token, // passed to client JS for URL refresh
      }));
    } catch (err) {
      console.error("[web-player] GET /watch/:token", err);
      res.status(500).send(errorPage(
        "Something went wrong",
        "We couldn't load this message. Please try again later or contact support@bhumi.app.",
        "support@bhumi.app"
      ));
    }
  });

  // ─── GET /watch/:token/video — fresh signed URL (called by player JS) ────────
  // Used when the 24-hour signed URL expires during a long viewing session,
  // or when the initial page load had a transient R2 error.
  app.get("/watch/:token/video", async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
      const msg = await queryOne<any>(
        "SELECT video_key FROM milestone_messages WHERE delivery_token = $1 AND is_delivered = TRUE",
        [token]
      );
      if (!msg) {
        res.status(404).json({ error: "Link not found or expired." });
        return;
      }
      if (!msg.video_key) {
        res.status(404).json({ error: "No video attached to this message." });
        return;
      }
      const playUrl = await getPlaybackUrl(msg.video_key, 3600); // 1 hour
      res.json({ playUrl });
    } catch (err) {
      console.error("[web-player] GET /watch/:token/video", err);
      res.status(503).json({ error: "Video temporarily unavailable. Please try again." });
    }
  });
}

// ─── HTML escape ──────────────────────────────────────────────────────────────
function he(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ─── Player page HTML ─────────────────────────────────────────────────────────
function playerPage({ senderName, messageTitle, recipientName, playUrl, videoError, refreshToken }: {
  senderName:    string;
  messageTitle:  string;
  recipientName: string;
  playUrl:       string | null;
  videoError:    string | null;
  refreshToken:  string;
}): string {

  // Build the video section HTML based on what we have
  let videoSection: string;

  if (videoError) {
    // R2 was down at load time — show retry button that hits /watch/:token/video
    videoSection = `
      <div class="video-error" id="video-error">
        <div class="video-error-icon">⚠️</div>
        <p class="video-error-msg">${he(videoError)}</p>
        <button class="retry-btn" onclick="retryVideo()">Try again</button>
      </div>
      <div class="video-wrap" id="video-wrap" style="display:none">
        <video id="main-video" controls playsinline preload="metadata">
          <source id="video-src" src="" type="video/mp4">
        </video>
      </div>`;
  } else if (playUrl) {
    // Happy path — video URL generated successfully
    videoSection = `
      <div class="video-wrap" id="video-wrap">
        <video id="main-video" controls playsinline preload="metadata"
               onerror="handleVideoError()">
          <source id="video-src" src="${playUrl}" type="video/mp4">
          <p style="color:#9C8070;padding:20px;text-align:center">
            Your browser doesn't support video playback.
            <a href="${playUrl}" style="color:#C4773B">Download the video instead →</a>
          </p>
        </video>
      </div>`;
  } else {
    // No video_key — message has no video (text only or recording was lost)
    videoSection = `
      <div class="no-video">
        <div style="font-size:32px;margin-bottom:12px">💌</div>
        <p>This message doesn't include a video recording.</p>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>${messageTitle} — Bhumi</title>
  <meta name="description" content="${senderName} left you a personal message on Bhumi.">
  <meta name="robots" content="noindex, nofollow">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      background: #1A0F0A;
      color: #FAE8D8;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      padding: 32px 20px 60px;
    }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #C4773B, #D4A017);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }
    .logo-name { font-size: 22px; font-weight: 900; color: #FAE8D8; letter-spacing: -0.5px; }
    .card {
      width: 100%; max-width: 560px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(196,119,59,0.25);
      border-radius: 20px; overflow: hidden;
    }
    .video-wrap { position: relative; width: 100%; background: #000; aspect-ratio: 16/9; }
    video { width: 100%; height: 100%; display: block; }
    .no-video {
      width: 100%; aspect-ratio: 16/9;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0D0805; color: #6B5344;
      font-size: 14px; text-align: center; padding: 20px;
    }
    .video-error {
      width: 100%; aspect-ratio: 16/9;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #0D0805; gap: 12px; padding: 24px;
    }
    .video-error-icon { font-size: 32px; }
    .video-error-msg { font-size: 13px; color: #9C8070; text-align: center; line-height: 1.6; }
    .retry-btn {
      background: rgba(196,119,59,0.2); color: #C4773B;
      border: 1px solid rgba(196,119,59,0.4); border-radius: 8px;
      padding: 8px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .retry-btn:hover { background: rgba(196,119,59,0.3); }
    .video-loading {
      width: 100%; aspect-ratio: 16/9;
      display: flex; align-items: center; justify-content: center;
      background: #0D0805;
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(196,119,59,0.2);
      border-top-color: #C4773B;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .info { padding: 24px; }
    .eyebrow { font-size: 10px; font-weight: 700; color: #C4773B; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 800; color: #FAE8D8; line-height: 1.3; margin-bottom: 10px; }
    .from { font-size: 14px; color: #9C8070; line-height: 1.6; }
    .from strong { color: #FAE8D8; }
    .nudge {
      width: 100%; max-width: 560px; margin-top: 20px;
      padding: 16px 20px;
      background: rgba(196,119,59,0.08);
      border: 1px solid rgba(196,119,59,0.2); border-radius: 14px; text-align: center;
    }
    .nudge p { font-size: 13px; color: #9C8070; line-height: 1.6; margin-bottom: 12px; }
    .nudge a {
      display: inline-block;
      background: linear-gradient(90deg, #C4773B, #D4A017);
      color: #FAF7F2; text-decoration: none; font-size: 14px; font-weight: 700;
      padding: 11px 28px; border-radius: 10px;
    }
    .support-note { width: 100%; max-width: 560px; margin-top: 12px; text-align: center; }
    .support-note a { font-size: 12px; color: #6B5344; text-decoration: underline; }
    footer { margin-top: 32px; font-size: 12px; color: #4A3328; text-align: center; line-height: 1.8; }
    footer a { color: #6B5344; text-decoration: none; }
    @media (max-width: 400px) { .title { font-size: 18px; } }
  </style>
</head>
<body>

  <div class="logo">
    <div class="logo-icon">🌱</div>
    <span class="logo-name">Bhumi</span>
  </div>

  <div class="card">
    ${videoSection}
    <div class="info">
      <div class="eyebrow">A personal message</div>
      <h1 class="title">${messageTitle}</h1>
      <p class="from">
        From <strong>${senderName}</strong>${recipientName ? `, for <strong>${recipientName}</strong>` : ""}.
        Recorded with love, delivered at the right moment.
      </p>
    </div>
  </div>

  <div class="nudge">
    <p>Want to receive all of ${senderName}'s messages in one place?</p>
    <a href="https://apps.apple.com/app/bhumi/id6818900352">Download Bhumi on iPhone →</a>
  </div>

  <div class="support-note">
    <a href="mailto:support@bhumi.app">Problem with this link? Contact support@bhumi.app</a>
  </div>

  <footer>
    <p>This link is private and expires in 30 days.</p>
    <p><a href="https://bhumi.app">bhumi.app</a> &nbsp;·&nbsp; <a href="https://bhumi.app/privacy">Privacy</a></p>
  </footer>

  <script>
    const REFRESH_TOKEN = "${he(refreshToken)}";

    // Called when the <video> element fires onerror (file missing, codec issue, etc.)
    function handleVideoError() {
      var video = document.getElementById("main-video");
      var wrap  = document.getElementById("video-wrap");
      if (!video || !wrap) return;

      // Try fetching a fresh signed URL first — the 24-hour URL may have just expired
      fetchFreshUrl().then(function(url) {
        if (url) {
          document.getElementById("video-src").src = url;
          video.load();
        } else {
          // Replace the player with an error state
          wrap.innerHTML = '<div class="video-error">' +
            '<div class="video-error-icon">⚠️</div>' +
            '<p class="video-error-msg">This video couldn\'t be loaded.<br>The file may still be processing. Try again in a few minutes.</p>' +
            '<button class="retry-btn" onclick="manualRetry()">Try again</button>' +
            '<a href="mailto:support@bhumi.app" style="font-size:12px;color:#6B5344;margin-top:8px">Contact support</a>' +
            '</div>';
        }
      });
    }

    // Called by the retry button when R2 was down at page load
    function retryVideo() {
      var errorDiv = document.getElementById("video-error");
      var wrapDiv  = document.getElementById("video-wrap");
      if (!errorDiv || !wrapDiv) return;

      // Show spinner while fetching
      errorDiv.innerHTML = '<div class="video-loading"><div class="spinner"></div></div>';

      fetchFreshUrl().then(function(url) {
        if (url) {
          document.getElementById("video-src").src = url;
          document.getElementById("main-video").load();
          errorDiv.style.display = "none";
          wrapDiv.style.display  = "block";
        } else {
          errorDiv.innerHTML =
            '<div class="video-error-icon">⚠️</div>' +
            '<p class="video-error-msg">Still unavailable. Please try again in a few minutes.</p>' +
            '<button class="retry-btn" onclick="retryVideo()">Try again</button>' +
            '<a href="mailto:support@bhumi.app" style="font-size:12px;color:#6B5344;margin-top:8px">Contact support</a>';
        }
      });
    }

    function manualRetry() {
      location.reload();
    }

    // Fetch a fresh 1-hour signed URL from the server
    function fetchFreshUrl() {
      return fetch("/watch/" + REFRESH_TOKEN + "/video")
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) { return (d && d.playUrl) ? d.playUrl : null; })
        .catch(function() { return null; });
    }

    // Auto-refresh the URL 5 minutes before the 24-hour expiry
    // (handles the edge case where someone leaves the tab open all day)
    setTimeout(function() {
      fetchFreshUrl().then(function(url) {
        if (!url) return;
        var src   = document.getElementById("video-src");
        var video = document.getElementById("main-video");
        if (!src || !video) return;
        var currentTime = video.currentTime;
        var paused      = video.paused;
        src.src = url;
        video.load();
        video.currentTime = currentTime;
        if (!paused) video.play().catch(function(){});
      });
    }, (24 * 60 * 60 - 5 * 60) * 1000); // 23h 55m
  </script>

</body>
</html>`;
}

// ─── Error page ───────────────────────────────────────────────────────────────
function errorPage(title: string, message: string, supportEmail: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${he(title)} — Bhumi</title>
  <style>
    body {
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      background: #1A0F0A; color: #FAE8D8;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px; text-align: center;
    }
    h1  { font-size: 24px; font-weight: 800; margin-bottom: 12px; }
    p   { font-size: 15px; color: #9C8070; line-height: 1.6; margin-bottom: 8px; }
    .links { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
    a   { color: #C4773B; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div>
    <div style="font-size:48px;margin-bottom:16px">🌱</div>
    <h1>${he(title)}</h1>
    <p>${he(message)}</p>
    <div class="links">
      <a href="https://bhumi.app">Go to Bhumi →</a>
      <a href="mailto:${he(supportEmail)}">Contact ${he(supportEmail)}</a>
    </div>
  </div>
</body>
</html>`;
}
