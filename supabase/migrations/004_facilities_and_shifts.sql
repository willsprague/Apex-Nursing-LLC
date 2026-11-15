-- Facility accounts and shift posting (backlog US-201/US-202).
-- Run once in Supabase after 001 and 002: SQL Editor > New query > paste > Run.
-- All writes go through the functions below, which enforce the rules. Tables are read-only to users.

-- Settings you control from the admin page.
create table if not exists public.app_settings (
  key   text primary key,
  value numeric not null
);
insert into public.app_settings (key, value) values ('fee_percent', 25)
  on conflict (key) do nothing;
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;
drop policy if exists "read settings" on public.app_settings;
create policy "read settings" on public.app_settings for select to authenticated using (true);

-- Roles facilities can request, with the lowest hourly rate a facility may offer for each.
create table if not exists public.shift_roles (
  role          text primary key,
  min_bill_rate numeric(6, 2) not null default 0 check (min_bill_rate >= 0)
);
insert into public.shift_roles (role) values
  ('Registered nurse (RN)'), ('Licensed practical nurse (LPN)'),
  ('Licensed nursing assistant (LNA)'), ('Dietary aide'), ('Housekeeping'), ('Activities aide')
  on conflict (role) do nothing;
alter table public.shift_roles enable row level security;
revoke all on public.shift_roles from anon, authenticated;
grant select on public.shift_roles to authenticated;
drop policy if exists "read roles" on public.shift_roles;
create policy "read roles" on public.shift_roles for select to authenticated using (true);

-- One facility per login. Staff mark it verified after checking it is real.
create table if not exists public.facilities (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  owner_id      uuid not null unique references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 200),
  facility_type text not null check (facility_type in
                ('Long-term care', 'Hospital', 'Home health or clinic', 'Other')),
  contact_name  text not null check (char_length(contact_name) between 1 and 200),
  verified      boolean not null default false
);
alter table public.facilities enable row level security;
revoke all on public.facilities from anon, authenticated;
grant select on public.facilities to authenticated;
drop policy if exists "read own facility" on public.facilities;
create policy "read own facility" on public.facilities
  for select to authenticated using (owner_id = auth.uid() or public.is_admin());

-- Shifts. fee_percent and worker_rate are filled in by create_shift and never change afterward.
create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  role        text not null references public.shift_roles (role),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  headcount   int not null check (headcount between 1 and 20),
  bill_rate   numeric(6, 2) not null check (bill_rate between 10 and 300),
  fee_percent numeric(5, 2) not null,
  worker_rate numeric(6, 2) not null,
  notes       text not null default '' check (char_length(notes) <= 300),
  status      text not null default 'open' check (status in ('open', 'filled', 'cancelled')),
  check (ends_at > starts_at)
);
create index if not exists shifts_facility_idx on public.shifts (facility_id, starts_at);
alter table public.shifts enable row level security;
revoke all on public.shifts from anon, authenticated;
grant select on public.shifts to authenticated;
drop policy if exists "read own shifts" on public.shifts;
create policy "read own shifts" on public.shifts for select to authenticated using (
  public.is_admin()
  or exists (select 1 from public.facilities f where f.id = facility_id and f.owner_id = auth.uid())
);

-- Facility signs up its facility (once per login).
create or replace function public.register_facility(p_name text, p_type text, p_contact text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if exists (select 1 from public.facilities where owner_id = auth.uid()) then
    raise exception 'This account already has a facility.';
  end if;
  insert into public.facilities (owner_id, name, facility_type, contact_name)
  values (auth.uid(), trim(p_name), p_type, trim(p_contact))
  returning id into new_id;
  return new_id;
end;
$$;

-- Facility posts a shift. Times are Eastern. If the end time is not after the start, it ends the next day.
create or replace function public.create_shift(
  p_role text, p_date date, p_start time, p_end time,
  p_headcount int, p_bill_rate numeric, p_notes text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  fid uuid; s timestamptz; e timestamptz; fee numeric; minrate numeric; new_id uuid;
begin
  select id into fid from public.facilities where owner_id = auth.uid() and verified;
  if fid is null then raise exception 'Your facility has not been verified yet.'; end if;

  select min_bill_rate into minrate from public.shift_roles where role = p_role;
  if not found then raise exception 'Choose a role from the list.'; end if;
  if p_bill_rate is null or p_bill_rate < greatest(minrate, 10) or p_bill_rate > 300 then
    raise exception 'The hourly rate for this role must be at least $% and no more than $300.',
      greatest(minrate, 10);
  end if;
  if p_headcount is null or p_headcount < 1 or p_headcount > 20 then
    raise exception 'Choose between 1 and 20 people.';
  end if;
  if char_length(coalesce(p_notes, '')) > 300 then raise exception 'Keep notes to 300 characters.'; end if;

  s := (p_date + p_start) at time zone 'America/New_York';
  e := (p_date + p_end) at time zone 'America/New_York';
  if p_end <= p_start then e := e + interval '1 day'; end if;
  if s <= now() then raise exception 'The shift must start in the future.'; end if;
  if e - s > interval '16 hours' then raise exception 'Shifts can be at most 16 hours.'; end if;

  select value into fee from public.app_settings where key = 'fee_percent';
  if fee is null then raise exception 'Pricing is not set up yet.'; end if;

  insert into public.shifts
    (facility_id, role, starts_at, ends_at, headcount, bill_rate, fee_percent, worker_rate, notes)
  values
    (fid, p_role, s, e, p_headcount, p_bill_rate, fee,
     round(p_bill_rate * (1 - fee / 100), 2), coalesce(trim(p_notes), ''))
  returning id into new_id;
  return new_id;
end;
$$;

-- Facility cancels its own open shift, more than 24 hours before it starts.
create or replace function public.cancel_shift(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare sh public.shifts;
begin
  select s.* into sh from public.shifts s
    join public.facilities f on f.id = s.facility_id
    where s.id = p_id and f.owner_id = auth.uid();
  if not found then raise exception 'Shift not found.'; end if;
  if sh.status <> 'open' then raise exception 'Only open shifts can be cancelled here. Contact us.'; end if;
  if sh.starts_at < now() + interval '24 hours' then
    raise exception 'Shifts can only be cancelled more than 24 hours before they start. Contact us.';
  end if;
  update public.shifts set status = 'cancelled' where id = p_id;
end;
$$;

-- Staff-only changes.
create or replace function public.admin_set_fee(v numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if v is null or v < 0 or v > 60 then raise exception 'Fee must be between 0 and 60 percent.'; end if;
  update public.app_settings set value = v where key = 'fee_percent';
end;
$$;

create or replace function public.admin_set_role_min(p_role text, v numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if v is null or v < 0 or v > 300 then raise exception 'Minimum must be between 0 and 300.'; end if;
  update public.shift_roles set min_bill_rate = v where role = p_role;
end;
$$;

create or replace function public.admin_set_facility_verified(target uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.facilities set verified = value where id = target;
end;
$$;

create or replace function public.admin_set_shift_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if new_status not in ('open', 'filled', 'cancelled') then raise exception 'Bad status.'; end if;
  update public.shifts set status = new_status where id = target;
end;
$$;

-- Only signed-in users may call these. Each function checks who is calling.
revoke all on function
  public.register_facility(text, text, text),
  public.create_shift(text, date, time, time, int, numeric, text),
  public.cancel_shift(uuid),
  public.admin_set_fee(numeric),
  public.admin_set_role_min(text, numeric),
  public.admin_set_facility_verified(uuid, boolean),
  public.admin_set_shift_status(uuid, text)
  from public, anon;
grant execute on function
  public.register_facility(text, text, text),
  public.create_shift(text, date, time, time, int, numeric, text),
  public.cancel_shift(uuid),
  public.admin_set_fee(numeric),
  public.admin_set_role_min(text, numeric),
  public.admin_set_facility_verified(uuid, boolean),
  public.admin_set_shift_status(uuid, text)
  to authenticated;
