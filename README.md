# Bhumi

Personal digital legacy app — record daily video check-ins and milestone messages for your family.

## Stack
- **iOS App**: Expo SDK 57, React Native, Expo Router, NativeWind, Zustand, RevenueCat
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (Neon), S3 Object Storage (Neon)
- **Infrastructure**: Railway (compute), Neon (database + storage), EAS (builds)

## Structure
```
bhumi-new/        ← iOS app
bhumi-backend/    ← Node.js API
bhumi-web/        ← Privacy policy website
bhumi-screenshots/ ← App Store screenshots
```

## Key Info
- Bundle ID: `com.bhumi.app`
- App Store App ID: `6818900352`
- EAS Account: `shanujain00`
- Backend URL: `https://postgresql-production-ccae2a4b.up.railway.app`
