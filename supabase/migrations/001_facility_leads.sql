-- Facility requests from the website form (backlog US-201).
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.facility_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  facility      text not null check (char_length(facility) between 1 and 200),
  contact       text not null check (char_length(contact) between 1 and 200),
  email         text not null check (char_length(email) between 3 and 254),
  facility_type text not null,
  need          text not null,
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'qualified', 'closed'))
);

-- Lock the table down. With row level security on and no policies, public and
-- logged-in website users cannot read or write it. The website's server code
-- writes with the service role key, which bypasses these rules.
alter table public.facility_leads enable row level security;
revoke all on public.facility_leads from anon, authenticated;
