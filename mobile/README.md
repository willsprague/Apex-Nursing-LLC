# Apixora mobile app (iPhone and Android)

Built with Expo (React Native). First version: home health care listings.

- **People who need care** sign in, wait for staff to verify them, then post a care need (town, type of care, schedule, hourly rate). Listings are reviewed by staff before nurses see them.
- **Nurses and caregivers** sign in, wait for staff to verify their license, then see approved listings.
- Staff verify people and approve listings on the website at `/admin`.

## One-time setup

1. Run `supabase/migrations/003_profiles_and_listings.sql` in the Supabase SQL Editor (after 001 and 002).
2. In Supabase, open Authentication > Email Templates > Magic Link and make sure the message includes the code: `Your sign-in code is {{ .Token }}`. The app signs in with that code. You can keep the website's link in the same template.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key.
4. In this folder run `npm install`, then `npx expo start`. Scan the QR code with the Expo Go app on your phone to try it.

## Publishing to the app stores (later)

Use Expo's build service (`eas build`). You need an Apple Developer account (about $99 a year) and a Google Play developer account (one-time fee, about $25). Check current prices when you sign up. Apple reviews apps that handle accounts, so plan a few days to a couple of weeks for approval.

## Notes

- This app uses only the public anon key. Access rules live in the database (row level security), not in the app.
- A shift board for facilities is the planned next feature.
- Not yet run on a device: package installs were blocked when this was written, so the first `npm install` and test run may surface small fixes.
