# Apex-Nursing-LLC

Repo for Apex Nurse Partners LLC, doing business as Apixora (trade name not yet filed; name still under review).

## What's here

- `app/`, `components/`, `lib/`, `public/`: the website, built with Next.js. It has the logo, three facility-type tabs (long-term care, hospitals, home health and clinics), and a facility request form that saves to Supabase.
- `supabase/migrations/001_facility_leads.sql`: creates the table the form writes to. Run it once in the Supabase SQL Editor.
- `site/index.html`: the earlier single-file homepage draft. It is a preview only, and the form there is not connected to anything.

## Set up the form (one time)

1. Create a project at supabase.com.
2. In the SQL Editor, paste and run `supabase/migrations/001_facility_leads.sql`.
3. In Supabase, open Project Settings > API and copy the project URL and the `service_role` key.
4. In Vercel, open the project's Settings > Environment Variables and add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with those values. Redeploy.

Until step 4 is done, the form tells visitors that nothing was sent, so no request is lost silently. Requests appear in Supabase under Table Editor > `facility_leads`.

## Staff sign-in (admin page)

`/login` emails a one-time link. Facilities use it to create an account and land on `/portal`. `/admin` lists facility requests, accounts and shifts, and only opens for emails in the `admins` table.

1. In the Supabase SQL Editor, run `supabase/migrations/002_admin_auth.sql`, then run the `insert into public.admins ...` line at the bottom with your email.
2. Go to `/login` on the live site and sign in once with that same email, so your account exists.
3. Supabase's default sign-in email works as is. Open the link in the same browser you requested it from. (Editing the template needs custom SMTP; if you set that up, you may use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.)
4. In Authentication > URL Configuration, set Site URL to your live site address and add `https://your-live-address/**` under Redirect URLs.
5. Make sure Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the Supabase integration adds them). Redeploy.

## Facility shifts

Run `supabase/migrations/004_facilities_and_shifts.sql` in the Supabase SQL Editor (after 001 and 002).

- A facility signs in at `/login`, registers on `/portal`, and waits for you to mark it verified on `/admin`.
- A verified facility posts shifts: role, date, times (Eastern), people needed, and the hourly rate it will pay. The worker rate is that rate minus the Apixora fee, and it is saved with the shift.
- On `/admin`, **Pricing** sets the fee percent (starts at 25) and the lowest rate allowed per role. Role minimums start at 0, so set them before launch. Fee changes affect only shifts posted afterward.
- Facilities can cancel an open shift more than 24 hours before it starts. Staff can mark shifts filled, reopen or cancel from `/admin`.
- All rules are enforced in the database, not only in the pages.

## Run it on your computer (optional)

```
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev
```

## Brand name

The name, descriptor, and region are set in `lib/brand.js`. The logo files in `public/` (`mark.webp` emblem, `logo.webp` with the Apixora name) are cut from the new logo image on a transparent background.

## Notes

- `app/layout.js` tells search engines not to list the site. Remove that line when the site is ready to be public.
- The service role key can read and write all data. It is used only in server code (`app/actions.js`) and must never get a `NEXT_PUBLIC_` prefix.

## Rules for this repo

- Never commit passwords, API keys, or facility or worker data. Keys belong in the hosting provider's settings, and data belongs in the database.
