# 🌱 BHUMI

> **The foundation you leave behind.**

Bhumi is an AI-powered living legacy platform that preserves who you are — your voice, your wisdom, your financial legacy — so your family never loses you completely.

---

## What is Bhumi?

Most people leave behind money. The lucky ones leave behind something far more precious — themselves.

Bhumi lets you:
- **Record daily 30-second check-ins** — your voice, your face, your thoughts, preserved forever
- **Create milestone messages** — record letters that unlock on your child's wedding day, their first heartbreak, when they need you most
- **Map your financial legacy** — every asset, every beneficiary, in one place
- **Build an AI legacy** — after years of check-ins, your AI can answer your family's questions in your voice

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo Router |
| Language | TypeScript (strict) |
| Styling | NativeWind (Tailwind for RN) |
| Animations | Reanimated 3 |
| State | Zustand |
| API | TanStack Query |
| Camera | Expo Camera + AV |
| Auth | Phone OTP + Biometrics |
| Storage | AWS S3 + CloudFront |
| AI | OpenAI GPT-4o + Whisper + ElevenLabs |
| Banking | Plaid + Unit |
| Payments | Stripe |
| Security | E2E encryption + SecureStore |

---

## Project Structure

```
bhumi/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Entry point / router
│   ├── (onboarding)/            # Onboarding flow
│   │   ├── welcome.tsx          # Emotional welcome screen
│   │   ├── story.tsx            # Story that makes people feel the pain
│   │   ├── what-is-bhumi.tsx    # Feature overview
│   │   ├── how-it-works.tsx     # How it works
│   │   └── permissions.tsx      # Camera/mic permissions
│   ├── (auth)/                  # Authentication
│   │   ├── signin.tsx           # Phone + OTP sign in
│   │   ├── signup.tsx           # New user registration
│   │   └── verify.tsx           # OTP verification
│   └── (tabs)/                  # Main app tabs
│       ├── home.tsx             # Home dashboard
│       ├── vault.tsx            # Video memory vault
│       ├── check-in.tsx         # Daily 30s check-in (camera)
│       ├── messages.tsx         # Milestone messages
│       └── legacy.tsx           # Financial legacy/assets
├── components/                  # Reusable UI components
├── constants/
│   └── theme.ts                 # Colors, typography, spacing
├── store/
│   └── appStore.ts              # Zustand global state
├── hooks/                       # Custom React hooks
├── utils/                       # Helper functions
└── assets/                      # Images, icons, fonts
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://api.bhumi.app
EXPO_PUBLIC_PLAID_CLIENT_ID=your_plaid_client_id
EXPO_PUBLIC_STRIPE_KEY=your_stripe_publishable_key
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=bhumi-media
```

---

## Brand

- **Name:** Bhumi (भूमि — Sanskrit for earth, foundation)
- **Tagline:** The foundation you leave behind.
- **Colors:** Deep earth tones — terracotta `#C4773B`, gold `#D4A017`, forest `#2D7D57`
- **Feel:** Warm. Calm. Trustworthy. Timeless.

---

## Roadmap

### Phase 1 — Legacy Core ✅
- [x] Onboarding with emotional story flow
- [x] Daily 30-second check-in with camera
- [x] Memory vault with full archive
- [x] Milestone messages vault
- [x] Financial legacy / asset mapping

### Phase 2 — AI Layer 🔄
- [ ] AI Succession Advisor chatbot
- [ ] Legacy Health Score engine
- [ ] AI will & succession plan generator
- [ ] AI asset discovery (email scanning)
- [ ] AI personality preservation

### Phase 3 — Financial Integration 📋
- [ ] Plaid bank account connection
- [ ] Unit BaaS integration
- [ ] Beneficiary management
- [ ] Estate bridge loans
- [ ] Cross-border (HK + India) support

### Phase 4 — App Store 🚀
- [ ] TestFlight beta (100 users in HK)
- [ ] App Store submission
- [ ] India launch
- [ ] Global rollout

---

## Built with IBM Bob

This product was architected and built with IBM Bob — IBM's AI software engineer.

---

*"What would your family give to hear your voice one more time?"*
