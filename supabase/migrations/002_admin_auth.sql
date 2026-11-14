-- Admin-only login (backlog: admin dashboard). Run once in Supabase: SQL Editor > New query > paste > Run.
-- Sign-in is by email link. Only emails listed in public.admins can read leads.

create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- True only for a signed-in user whose verified email is in the admins table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Let signed-in users run the check; the policies below still require is_admin().
grant select, update (status) on public.facility_leads to authenticated;

drop policy if exists "admins read leads" on public.facility_leads;
create policy "admins read leads" on public.facility_leads
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update lead status" on public.facility_leads;
create policy "admins update lead status" on public.facility_leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Add yourself (use your real email, lowercase):
-- insert into public.admins (email) values ('you@example.com');
