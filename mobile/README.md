# Apixora mobile app (iPhone and Android)

Built with Expo (React Native). It does what the website does for nurses and facilities. Staff tools stay on the website at `/admin`.

- **Everyone:** a public front page explains Apixora (with example shifts), then sign in with an emailed code (no password) and choose facility or nurse. Applicants get a Home tab and an Application tab.
- **Nurses and aides:** apply today (formal application with two professional references), follow the status tracker, and once cleared create a worker account. Verified workers see open shifts for their role with their own pay (bonus shown), claim shifts, and withdraw claims.
- **Facilities:** register, wait for verification, then post shifts, add or raise a bonus, and cancel shifts. Facilities never see the Apixora fee or the worker's pay.

The old home health listings screens were removed. That idea is parked (backlog US-206).

## One-time setup

1. In the Supabase SQL Editor run migrations 001 to 012 from `supabase/migrations/` if they have not been run. Migration 009 adds `submit_application`, which the phone uses instead of the website's server-only key, and 011 and 012 update it (work history, reference permission, state and ZIP).
2. In Supabase open Authentication > Email Templates > Magic Link and make sure the message includes the code: `Your sign-in code is {{ .Token }}`. You can keep the website's link in the same template.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key.
4. You need Node.js 22.13 or newer (the LTS download at nodejs.org works). In this folder run `npm install`, then `npx expo install --fix` (this lines up the other packages with Expo SDK 58), then `npx expo start --clear`. Scan the QR code with the Expo Go app to try it.
5. If the phone says the project is the wrong SDK, update the Expo Go app. The app is on Expo SDK 58, and Expo Go only opens the SDK it was built for.

## Publishing to the app stores (later)

Use Expo's build service (`eas build`). You need an Apple Developer account (about $99 a year) and a Google Play developer account (one-time fee, about $25). Check current prices when you sign up. Apple reviews apps that handle accounts, so plan a few days to a couple of weeks.

## Notes

- Only the public anon key is in the app. Access rules live in the database (row level security and security-definer functions).
- `src/options.js` mirrors `app/apply/options.js` on the website. Change both together.
- Not yet run on a device: package installs were blocked when this was written, so the first `npm install` and test run may surface small fixes. All screens were syntax-checked and migration 009 was tested in a local Postgres.
- Later: push alerts for new shifts and claim confirmations, a date picker for posting shifts, and the shift calendar.
