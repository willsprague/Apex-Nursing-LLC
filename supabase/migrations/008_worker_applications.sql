-- Worker applications from the public /apply page (backlog US-527).
-- Run once in the Supabase SQL Editor: New query > paste > Run.
-- This is the formal application. It records which forms of ID the applicant can
-- provide, but NOT the ID itself or a Social Security number. Those go through the
-- background check provider's secure page and the in-person I-9 check later.
-- Intake stages: new > contacted > background_check > approved > health_screening > cleared.
-- 'approved' means references, license and background check passed. Only then is the
-- applicant sent for the physical and TB test (outside urgent care), so nobody pays
-- for a medical visit and then gets denied. 'cleared' means health screening is done
-- and the person can make a worker account. Record only the stage here, never test
-- results or medical details.
-- Staff screen applicants and verify the license by hand before inviting them to
-- make a worker account.

create table if not exists public.worker_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  full_name     text not null check (char_length(full_name) between 1 and 100),
  email         text not null check (char_length(email) between 3 and 254),
  phone         text not null check (char_length(phone) between 7 and 30),
  role          text not null check (char_length(role) between 1 and 80), -- credential type
  license_state text not null check (char_length(license_state) between 2 and 40),
  license_number text not null check (char_length(license_number) between 1 and 40),
  years_experience text not null,
  town          text not null check (char_length(town) between 1 and 100),
  license_disciplined boolean not null,
  id_types      text not null check (char_length(id_types) > 0),
  ref1_name text not null check (char_length(ref1_name) between 1 and 100),
  ref1_relationship text not null check (char_length(ref1_relationship) between 1 and 100),
  ref1_contact text not null check (char_length(ref1_contact) between 3 and 254),
  ref2_name text not null check (char_length(ref2_name) between 1 and 100),
  ref2_relationship text not null check (char_length(ref2_relationship) between 1 and 100),
  ref2_contact text not null check (char_length(ref2_contact) between 3 and 254),
  settings      text not null default '',
  availability  text not null,
  consent       boolean not null check (consent),
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'background_check', 'approved', 'health_screening', 'cleared', 'declined')),
  notes         text not null default '' check (char_length(notes) <= 1000)
);

alter table public.worker_applications enable row level security;
revoke all on public.worker_applications from anon, authenticated;

-- The website's server code inserts with the service role key, using the signed-in
-- user's id. Applicants can read their own application (everything except the staff
-- notes column). Staff read and update all of them.
grant select (id, user_id, created_at, full_name, email, phone, role, license_state, license_number,
  years_experience, town, license_disciplined, id_types, ref1_name, ref1_relationship, ref1_contact,
  ref2_name, ref2_relationship, ref2_contact, settings, availability, consent, status)
  on public.worker_applications to authenticated;
grant update (status, notes) on public.worker_applications to authenticated;

drop policy if exists "applicants read own application" on public.worker_applications;
create policy "applicants read own application" on public.worker_applications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins read applications" on public.worker_applications;
create policy "admins read applications" on public.worker_applications
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update applications" on public.worker_applications;
create policy "admins update applications" on public.worker_applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
