# Bhumi Backend API

Node.js / Express / TypeScript backend for the Bhumi legacy app.

## Stack
- **Runtime**: Node.js 20 + TypeScript
- **Database**: PostgreSQL (Supabase in prod)
- **Video storage**: Cloudflare R2 (S3-compatible)
- **SMS/OTP**: Twilio
- **Email**: SendGrid (via nodemailer SMTP)
- **Auth**: JWT (30-day tokens)
- **Cron**: node-cron (date triggers + deadman switch)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env — fill in DB, Twilio, SendGrid, R2 credentials

# 3. Create the database
createdb bhumi
psql bhumi -f src/db/schema.sql

# 4. Run in dev mode
npm run dev
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/send-otp` | — | Send OTP to phone |
| POST | `/api/auth/verify-otp` | — | Verify OTP, returns JWT |
| GET | `/api/users/me` | ✓ | Get current user |
| PATCH | `/api/users/me` | ✓ | Update name/email/prefs |
| DELETE | `/api/users/me` | ✓ | Delete account (GDPR) |
| PATCH | `/api/users/me/notification-prefs` | ✓ | Update reminder time |
| GET | `/api/checkins` | ✓ | List check-ins |
| POST | `/api/checkins/upload-url` | ✓ | Get R2 presigned upload URL |
| POST | `/api/checkins` | ✓ | Create check-in record |
| GET | `/api/checkins/:id/play` | ✓ | Get signed playback URL |
| GET | `/api/messages` | ✓ | List milestone messages |
| POST | `/api/messages` | ✓ | Create milestone message |
| POST | `/api/messages/:id/upload-url` | ✓ | Get presigned URL for message video |
| PATCH | `/api/messages/:id/record` | ✓ | Mark message as recorded |
| POST | `/api/messages/:id/deliver` | ✓ | Manually trigger delivery |
| GET | `/api/messages/watch/:token` | — | Public — recipient watch endpoint |
| GET | `/api/assets` | ✓ | List assets + health score |
| POST | `/api/assets` | ✓ | Add asset |
| PATCH | `/api/assets/:id` | ✓ | Update asset |
| DELETE | `/api/assets/:id` | ✓ | Delete asset |
| POST | `/api/deadman/trusted-contact` | ✓ | Save trusted contact |
| GET | `/api/deadman/confirm/:pingId` | — | Trusted contact confirmation link |

## Cron jobs

| Job | Schedule | What it does |
|-----|----------|-------------|
| Date trigger | Daily 9am UTC | Delivers messages whose trigger_date has passed |
| Deadman check | Daily 10am UTC | Pings trusted contact if user inactive 30+ days |
| Deadman expire | Hourly | Triggers delivery if trusted contact didn't respond in 7 days |

## Video upload flow

```
Mobile app → POST /checkins/upload-url → gets presigned R2 URL
           → uploads video directly to R2 (bypasses our server)
           → POST /checkins { videoKey, duration, prompt, dayNumber }
           → server records checkin, updates streak
```

## Delivery flow

```
Cron job fires → deliverMessage(msg)
              → SMS to recipient (Twilio)
              → Email to recipient (SendGrid)
              → Both contain: https://watch.bhumi.app/watch/{token}
              → Recipient opens web player → fetches signed R2 URL → watches video
```

## Deploy (Railway / Render / Fly.io)

```bash
npm run build
npm start
```

Set all `.env` variables in your hosting dashboard.
Database: use Supabase free tier (PostgreSQL) — set `DATABASE_URL`.
