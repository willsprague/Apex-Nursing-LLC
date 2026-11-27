-- AI-assisted intake interview (backlog US-539). Run once in the Supabase SQL Editor after 009.
-- The interview is a text chat after an applicant submits /apply. The AI asks job-related questions and
-- writes a summary and flags for staff. It never approves or rejects anyone; staff decide.
-- Applicants never read or write this table directly. The website's server saves it with the service role
-- key, for the signed-in applicant only. Staff (admins) can read it on /admin.
-- The transcript and summary are personal data. Decide a retention period with the attorney and delete
-- interviews for people who were declined or never finished once that period passes.

create table if not exists public.application_interviews (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null unique references public.worker_applications(id) on delete cascade,
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  status          text not null default 'in_progress'
                  check (status in ('in_progress', 'completed', 'human_requested')),
  messages        jsonb not null default '[]'::jsonb,   -- [{role: 'assistant'|'user', content: '...'}]
  summary         text,                                  -- written by the AI for staff, from the transcript only
  flags           jsonb not null default '[]'::jsonb,   -- [{type, detail}] objective items for staff to review
  model           text,
  notice_accepted_at timestamptz not null default now(),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

alter table public.application_interviews enable row level security;

drop policy if exists "admins read interviews" on public.application_interviews;
create policy "admins read interviews" on public.application_interviews
  for select to authenticated using (public.is_admin());

revoke all on public.application_interviews from anon, authenticated;
grant select on public.application_interviews to authenticated;
