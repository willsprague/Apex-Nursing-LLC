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
