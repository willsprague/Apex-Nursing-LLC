-- Accounts and home health care listings for the mobile app (backlog US-206).
-- Run once in Supabase after 001 and 002: SQL Editor > New query > paste > Run.

-- One profile per signed-in person. Role is chosen at sign-up; "verified" is set only by staff.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('poster', 'nurse')),
  display_name text not null check (char_length(display_name) between 1 and 100),
  verified     boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, role, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Helpers used by the listing rules.
create or replace function public.is_verified(want_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = want_role and verified
  );
$$;
revoke all on function public.is_verified(text) from public, anon;
grant execute on function public.is_verified(text) to authenticated;

-- Staff marks a person verified (after an ID or license check). Admins only.
create or replace function public.admin_set_verified(target uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.profiles set verified = value where id = target;
end;
$$;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

-- Listings. Nothing here may identify the person or their health details.
create table if not exists public.care_listings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  poster_id   uuid not null references public.profiles (id) on delete cascade,
  town        text not null check (char_length(town) between 1 and 80),
  care_type   text not null check (care_type in
              ('Personal care', 'Skilled nursing', 'Companion care', 'Overnight care', 'Other')),
  schedule    text not null check (char_length(schedule) between 1 and 200),
  hourly_rate numeric(6, 2) not null check (hourly_rate between 10 and 200),
  details     text not null default '' check (char_length(details) <= 500),
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected', 'closed'))
);
alter table public.care_listings enable row level security;
revoke all on public.care_listings from anon, authenticated;
grant select on public.care_listings to authenticated;
grant insert (poster_id, town, care_type, schedule, hourly_rate, details)
  on public.care_listings to authenticated;
grant update (status) on public.care_listings to authenticated;

drop policy if exists "poster reads own" on public.care_listings;
create policy "poster reads own" on public.care_listings
  for select to authenticated using (poster_id = auth.uid());
drop policy if exists "nurse reads approved" on public.care_listings;
create policy "nurse reads approved" on public.care_listings
  for select to authenticated using (status = 'approved' and public.is_verified('nurse'));
drop policy if exists "admin reads all listings" on public.care_listings;
create policy "admin reads all listings" on public.care_listings
  for select to authenticated using (public.is_admin());

drop policy if exists "verified poster creates" on public.care_listings;
create policy "verified poster creates" on public.care_listings
  for insert to authenticated
  with check (poster_id = auth.uid() and public.is_verified('poster'));

drop policy if exists "poster closes own" on public.care_listings;
create policy "poster closes own" on public.care_listings
  for update to authenticated
  using (poster_id = auth.uid() and status in ('pending', 'approved'))
  with check (poster_id = auth.uid() and status = 'closed');
drop policy if exists "admin sets status" on public.care_listings;
create policy "admin sets status" on public.care_listings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
