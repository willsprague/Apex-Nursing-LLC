-- Worker accounts, shift claims and staff confirmation (backlog US-203/US-204).
-- Run once in Supabase after 001, 002, 004 and 005: SQL Editor > New query > paste > Run.
-- Workers never see what the facility pays or the Apixora fee, only their own pay rate.

create table if not exists public.worker_profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  display_name   text not null check (char_length(display_name) between 1 and 100),
  role           text not null references public.shift_roles (role),
  license_number text not null check (char_length(license_number) between 1 and 40),
  verified       boolean not null default false
);
alter table public.worker_profiles enable row level security;
revoke all on public.worker_profiles from anon, authenticated;
grant select on public.worker_profiles to authenticated;
drop policy if exists "read own worker profile" on public.worker_profiles;
create policy "read own worker profile" on public.worker_profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- A worker's request for a shift. Staff confirm it. Only the functions below touch this table.
create table if not exists public.shift_claims (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  shift_id   uuid not null references public.shifts (id) on delete cascade,
  worker_id  uuid not null references public.worker_profiles (id) on delete cascade,
  status     text not null default 'claimed' check (status in ('claimed', 'confirmed', 'released')),
  unique (shift_id, worker_id)
);
alter table public.shift_claims enable row level security;
revoke all on public.shift_claims from anon, authenticated;

-- Marks a shift filled when enough claims are confirmed, and open again when not. Internal only.
create or replace function public.refresh_shift_status(p_shift uuid)
returns void language plpgsql security definer set search_path = public as $$
declare sh public.shifts; n int;
begin
  select * into sh from public.shifts where id = p_shift for update;
  if not found or sh.status = 'cancelled' then return; end if;
  select count(*) into n from public.shift_claims c where c.shift_id = p_shift and c.status = 'confirmed';
  update public.shifts set status = case when n >= sh.headcount then 'filled' else 'open' end
    where id = p_shift;
end;
$$;
revoke all on function public.refresh_shift_status(uuid) from public, anon, authenticated;

create or replace function public.register_worker(p_name text, p_role text, p_license text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if exists (select 1 from public.worker_profiles w where w.id = auth.uid()) then
    raise exception 'This account is already registered.';
  end if;
  if not exists (select 1 from public.shift_roles r where r.role = p_role) then
    raise exception 'Choose a role from the list.';
  end if;
  insert into public.worker_profiles (id, display_name, role, license_number)
  values (auth.uid(), trim(p_name), p_role, trim(p_license));
end;
$$;

-- Open shifts this worker may claim: their role, in the future, with room left. Shows their pay only.
create or replace function public.worker_open_shifts()
returns table (
  id uuid, facility_type text, role text, starts_at timestamptz, ends_at timestamptz,
  headcount int, spots_left int, worker_rate numeric, notes text
)
language sql stable security definer set search_path = public as $$
  with me as (
    select w.id, w.role from public.worker_profiles w where w.id = auth.uid() and w.verified
  ), open_shifts as (
    select s.*, s.headcount - (
      select count(*) from public.shift_claims c
      where c.shift_id = s.id and c.status in ('claimed', 'confirmed')
    )::int as left_count
    from public.shifts s
    where s.status = 'open' and s.starts_at > now()
  )
  select o.id, f.facility_type, o.role, o.starts_at, o.ends_at, o.headcount, o.left_count,
         o.worker_rate, o.notes
  from open_shifts o
  join me on me.role = o.role
  join public.facilities f on f.id = o.facility_id
  where o.left_count > 0
    and not exists (
      select 1 from public.shift_claims c
      where c.shift_id = o.id and c.worker_id = me.id and c.status in ('claimed', 'confirmed')
    )
  order by o.starts_at
  limit 100;
$$;

-- This worker's claims. The facility name appears only after staff confirm.
create or replace function public.worker_my_claims()
returns table (
  claim_id uuid, claim_status text, shift_id uuid, role text, starts_at timestamptz,
  ends_at timestamptz, worker_rate numeric, shift_status text, facility_name text, facility_type text
)
language sql stable security definer set search_path = public as $$
  select c.id, c.status, s.id, s.role, s.starts_at, s.ends_at, s.worker_rate, s.status,
         case when c.status = 'confirmed' then f.name end, f.facility_type
  from public.shift_claims c
  join public.shifts s on s.id = c.shift_id
  join public.facilities f on f.id = s.facility_id
  where c.worker_id = auth.uid() and c.status <> 'released'
  order by s.starts_at desc
  limit 100;
$$;

create or replace function public.claim_shift(p_shift uuid)
returns void language plpgsql security definer set search_path = public as $$
declare w public.worker_profiles; sh public.shifts; active int; clash boolean;
begin
  select * into w from public.worker_profiles p where p.id = auth.uid() and p.verified;
  if not found then raise exception 'Your account has not been verified yet.'; end if;

  select * into sh from public.shifts s where s.id = p_shift for update;
  if not found or sh.status <> 'open' or sh.starts_at <= now() then
    raise exception 'This shift is no longer open.';
  end if;
  if sh.role <> w.role then raise exception 'This shift is for a different role.'; end if;

  if exists (select 1 from public.shift_claims c
             where c.shift_id = p_shift and c.worker_id = w.id and c.status in ('claimed', 'confirmed')) then
    raise exception 'You already claimed this shift.';
  end if;

  select count(*) into active from public.shift_claims c
    where c.shift_id = p_shift and c.status in ('claimed', 'confirmed');
  if active >= sh.headcount then raise exception 'This shift already has enough people.'; end if;

  select exists (
    select 1 from public.shift_claims c join public.shifts s on s.id = c.shift_id
    where c.worker_id = w.id and c.status in ('claimed', 'confirmed')
      and s.id <> sh.id and s.status <> 'cancelled'
      and s.starts_at < sh.ends_at and s.ends_at > sh.starts_at
  ) into clash;
  if clash then raise exception 'You already have a shift that overlaps this one.'; end if;

  insert into public.shift_claims (shift_id, worker_id) values (p_shift, w.id)
  on conflict (shift_id, worker_id) do update set status = 'claimed', created_at = now();
end;
$$;

create or replace function public.withdraw_claim(p_claim uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cl public.shift_claims; sh public.shifts;
begin
  select * into cl from public.shift_claims c where c.id = p_claim and c.worker_id = auth.uid();
  if not found or cl.status = 'released' then raise exception 'Claim not found.'; end if;
  select * into sh from public.shifts s where s.id = cl.shift_id;
  if cl.status = 'confirmed' and sh.starts_at < now() + interval '24 hours' then
    raise exception 'Confirmed shifts can only be withdrawn more than 24 hours before they start. Contact us.';
  end if;
  update public.shift_claims set status = 'released' where id = p_claim;
  perform public.refresh_shift_status(cl.shift_id);
end;
$$;

-- Staff-only.
create or replace function public.admin_set_worker_verified(target uuid, value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  update public.worker_profiles set verified = value where id = target;
end;
$$;

create or replace function public.admin_list_workers()
returns table (id uuid, display_name text, role text, license_number text, verified boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select w.id, w.display_name, w.role, w.license_number, w.verified, w.created_at
    from public.worker_profiles w order by w.created_at desc limit 200;
end;
$$;

create or replace function public.admin_list_claims()
returns table (
  claim_id uuid, claim_status text, worker_name text, worker_role text, license_number text,
  facility_name text, shift_role text, starts_at timestamptz, ends_at timestamptz,
  worker_rate numeric, headcount int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select c.id, c.status, w.display_name, w.role, w.license_number, f.name, s.role,
           s.starts_at, s.ends_at, s.worker_rate, s.headcount
    from public.shift_claims c
    join public.worker_profiles w on w.id = c.worker_id
    join public.shifts s on s.id = c.shift_id
    join public.facilities f on f.id = s.facility_id
    where c.status <> 'released'
    order by (c.status = 'claimed') desc, s.starts_at
    limit 200;
end;
$$;

create or replace function public.admin_set_claim_status(p_claim uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare cl public.shift_claims;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('confirmed', 'released') then raise exception 'Bad status.'; end if;
  select * into cl from public.shift_claims c where c.id = p_claim for update;
  if not found or cl.status = 'released' then raise exception 'Claim not found.'; end if;
  update public.shift_claims set status = p_status where id = p_claim;
  perform public.refresh_shift_status(cl.shift_id);
end;
$$;

-- When a shift is cancelled, release everyone who claimed it.
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
  update public.shift_claims set status = 'released' where shift_id = p_id and status <> 'released';
end;
$$;

create or replace function public.admin_set_shift_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if new_status not in ('open', 'filled', 'cancelled') then raise exception 'Bad status.'; end if;
  update public.shifts set status = new_status where id = target;
  if new_status = 'cancelled' then
    update public.shift_claims set status = 'released' where shift_id = target and status <> 'released';
  end if;
end;
$$;

revoke all on function
  public.register_worker(text, text, text), public.worker_open_shifts(), public.worker_my_claims(),
  public.claim_shift(uuid), public.withdraw_claim(uuid), public.admin_set_worker_verified(uuid, boolean),
  public.admin_list_workers(), public.admin_list_claims(), public.admin_set_claim_status(uuid, text),
  public.cancel_shift(uuid), public.admin_set_shift_status(uuid, text)
  from public, anon;
grant execute on function
  public.register_worker(text, text, text), public.worker_open_shifts(), public.worker_my_claims(),
  public.claim_shift(uuid), public.withdraw_claim(uuid), public.admin_set_worker_verified(uuid, boolean),
  public.admin_list_workers(), public.admin_list_claims(), public.admin_set_claim_status(uuid, text),
  public.cancel_shift(uuid), public.admin_set_shift_status(uuid, text)
  to authenticated;
