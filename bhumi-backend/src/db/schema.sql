-- Bhumi PostgreSQL Schema
-- Run: psql $DATABASE_URL -f schema.sql

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT,
  phone           TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE,
  avatar_url      TEXT,
  is_pro          BOOLEAN DEFAULT FALSE,
  pro_expires_at  TIMESTAMPTZ,
  recording_for   TEXT[],          -- ['children','spouse']
  concern         TEXT,            -- 'voice'|'assets'|'message'|'all'
  streak          INT DEFAULT 0,
  total_days      INT DEFAULT 0,
  last_checkin_at TIMESTAMPTZ,
  push_token                TEXT,             -- Expo push token for notifications
  streak_freezes_remaining  INT DEFAULT 0,    -- Pro feature: skip-a-day freeze tokens
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OTP ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

-- ─── Check-ins ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_key   TEXT,               -- Cloudflare R2 object key
  video_url   TEXT,               -- public/signed URL
  duration    INT DEFAULT 0,      -- seconds
  prompt      TEXT,
  day_number  INT NOT NULL,
  thumbnail_key TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id, created_at DESC);

-- ─── Family Connections ───────────────────────────────────────────────────────
-- Creator invites family members. Family members accept and get their own inbox.
CREATE TABLE IF NOT EXISTS family_connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_id       UUID REFERENCES users(id) ON DELETE SET NULL,  -- null until they sign up
  invite_name     TEXT NOT NULL,          -- name creator gave them
  invite_phone    TEXT,
  invite_email    TEXT,
  invite_token    UUID DEFAULT uuid_generate_v4() UNIQUE,  -- deep link token
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','connected','declined')),
  connected_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_connections_creator ON family_connections(creator_id);
CREATE INDEX IF NOT EXISTS idx_connections_member  ON family_connections(member_id);
CREATE INDEX IF NOT EXISTS idx_connections_token   ON family_connections(invite_token);

-- ─── Life Events ──────────────────────────────────────────────────────────────
-- Predefined events a family member can "announce" to unlock messages.
-- Also stored when a member announces an event (for history).
CREATE TABLE IF NOT EXISTS life_event_announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key    TEXT NOT NULL,  -- 'wedding','baby','graduation','lost','strength','birthday','anniversary','custom'
  event_label  TEXT NOT NULL,  -- human-readable
  announced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_user ON life_event_announcements(user_id, event_key);

-- ─── Milestone Messages ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestone_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,

  -- Recipient — either a connected family member OR a raw phone/email (legacy / pre-connection)
  recipient_name        TEXT NOT NULL,
  recipient_phone       TEXT,
  recipient_email       TEXT,
  recipient_connection_id UUID REFERENCES family_connections(id) ON DELETE SET NULL,

  video_key       TEXT,
  text_content    TEXT,

  -- Trigger
  -- 'life_event' = unlocks when recipient announces event_key
  -- 'date'       = unlocks on trigger_date
  -- 'deadman'    = unlocks automatically after creator has been inactive for unlock_after_days
  -- 'manual'     = creator manually unlocks it
  -- 'recipient'  = recipient decides when to open (always visible in inbox, locked until they tap)
  trigger_type      TEXT NOT NULL CHECK (trigger_type IN ('life_event','date','deadman','manual','recipient')),
  trigger_event_key TEXT,  -- e.g. 'wedding','baby','graduation' — for trigger_type='life_event'
  trigger_date      DATE,  -- for trigger_type='date'
  unlock_after_days INT DEFAULT 30, -- for trigger_type='deadman': days of inactivity before unlock

  is_recorded     BOOLEAN DEFAULT FALSE,

  -- Delivery state
  is_unlocked     BOOLEAN DEFAULT FALSE,  -- has this message been made available to recipient?
  unlocked_at     TIMESTAMPTZ,
  unlocked_by     TEXT,                   -- 'life_event'|'date'|'deadman'|'manual'|'recipient'

  -- Read receipt — did recipient actually open it?
  is_opened       BOOLEAN DEFAULT FALSE,
  opened_at       TIMESTAMPTZ,

  -- Delivery (email/SMS fallback for non-app recipients)
  is_delivered    BOOLEAN DEFAULT FALSE,
  delivered_at    TIMESTAMPTZ,
  delivery_token  UUID DEFAULT uuid_generate_v4() UNIQUE,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_user       ON milestone_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_connection ON milestone_messages(recipient_connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_trigger    ON milestone_messages(trigger_type, trigger_date, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_messages_token      ON milestone_messages(delivery_token);

-- ─── Legacy Assets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL,
  value_cents      BIGINT,         -- stored in cents USD
  currency         TEXT DEFAULT 'USD',
  institution      TEXT,
  account_number   TEXT,           -- last 4 only
  beneficiary_name TEXT,
  link_status      TEXT DEFAULT 'not_added' CHECK (link_status IN ('linked','manual','not_added')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);

-- ─── Legacy Letters ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legacy_letters (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trusted Contacts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  confirmed    BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trusted_user ON trusted_contacts(user_id);

-- ─── Deadman Switch ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deadman_pings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES trusted_contacts(id),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','alive','triggered','expired')),
  pinged_at    TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL
);

-- ─── Notification Preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_hour    INT DEFAULT 20,    -- 8pm
  reminder_minute  INT DEFAULT 0,
  streak_alerts    BOOLEAN DEFAULT TRUE,
  milestone_alerts BOOLEAN DEFAULT TRUE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Delivery Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES milestone_messages(id),
  channel    TEXT NOT NULL CHECK (channel IN ('sms','email')),
  recipient  TEXT NOT NULL,
  status     TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','failed','bounced')),
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  provider_id TEXT   -- Twilio/SendGrid message ID
);

-- (passing_verifications and passing_votes tables removed — replaced by time-lock deadman system)
-- Deadman messages unlock automatically after unlock_after_days of inactivity (set per-message by creator).
-- No AI verification or family vote required.

-- ─── Deadman warnings log ─────────────────────────────────────────────────────
-- Tracks when we last warned a user that their messages are about to unlock.
-- Prevents spamming the warning notification.
CREATE TABLE IF NOT EXISTS deadman_warnings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)  -- one active warning per user; replaced when a new cycle starts
);
CREATE INDEX IF NOT EXISTS idx_deadman_warnings_user ON deadman_warnings(user_id);

-- ─── Apple Sign In ────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_user_id TEXT UNIQUE;

-- ─── Account Recovery & Portability ──────────────────────────────────────────
-- Lets users keep access if they change phone numbers or lose their device.
-- Email is the recovery anchor. Recovery code is a hashed 16-char fallback.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS recovery_code_hash   TEXT,       -- bcrypt of 16-char recovery code
  ADD COLUMN IF NOT EXISTS recovery_email       TEXT,       -- separate from contact email; used for account recovery
  ADD COLUMN IF NOT EXISTS email_verified       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verify_token   TEXT,       -- short-lived token for email verification
  ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ;

-- Phone change request: OTP-verified, then phone swapped
CREATE TABLE IF NOT EXISTS phone_change_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_phone   TEXT NOT NULL,
  code_hash   TEXT NOT NULL,   -- bcrypt of 6-digit OTP sent to new_phone
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_change_user ON phone_change_requests(user_id, created_at DESC);

-- Message PIN: 16-digit code unique per user, required to open sealed/milestone messages
-- Stored bcrypt-hashed. Never shown after creation.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS message_pin_hash     TEXT,       -- bcrypt of 16-digit PIN
  ADD COLUMN IF NOT EXISTS message_pin_set_at   TIMESTAMPTZ;

-- Invite accept state: explicit accept/decline stored per invite
ALTER TABLE family_connections
  ADD COLUMN IF NOT EXISTS accepted_at  TIMESTAMPTZ,  -- when recipient explicitly accepted
  ADD COLUMN IF NOT EXISTS declined_at  TIMESTAMPTZ;  -- when recipient explicitly declined

-- ─── User Documents ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_documents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,           -- original filename
  doc_type   TEXT NOT NULL DEFAULT 'other'
             CHECK (doc_type IN ('will','insurance','property','investment','identity','other')),
  file_key   TEXT NOT NULL,           -- R2 object key
  size_bytes BIGINT,
  mime_type  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON user_documents(user_id);

-- ─── Performance indexes for million-user scale ───────────────────────────────
-- Deadman pings: cron queries by status + expires_at
CREATE INDEX IF NOT EXISTS idx_deadman_pending ON deadman_pings(status, expires_at) WHERE status = 'pending';
-- Date-triggered messages: cron queries by trigger_type + date
CREATE INDEX IF NOT EXISTS idx_messages_date_trigger ON milestone_messages(trigger_date, is_delivered) WHERE trigger_type = 'date' AND is_delivered = FALSE;
-- OTP: clean up old used codes efficiently
CREATE INDEX IF NOT EXISTS idx_otp_used_created ON otp_codes(used, created_at) WHERE used = TRUE;
-- Family inbox: high-frequency query by member_id
CREATE INDEX IF NOT EXISTS idx_connections_member_status ON family_connections(member_id, status) WHERE status = 'connected';
-- Deadman messages by per-message threshold (cron queries by unlock_after_days + last_checkin_at)
CREATE INDEX IF NOT EXISTS idx_messages_deadman ON milestone_messages(user_id, trigger_type, is_unlocked)
  WHERE trigger_type = 'deadman' AND is_unlocked = FALSE;
