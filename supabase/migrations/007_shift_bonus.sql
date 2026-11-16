-- Facility bonus on open shifts, total pay for workers, and a separate bonus fee (backlog US-517).
-- Run once in Supabase after 001, 002, 004, 005 and 006: SQL Editor > New query > paste > Run.
-- The bonus fee is separate from the main fee so you can keep it low and tune it as costs become clear.

insert into public.app_settings (key, value) values ('bonus_fee_percent', 10)
  on conflict (key) do nothing;

alter table public.shifts
  add column if not exists bonus_rate        numeric(6, 2) not null default 0 check (bonus_rate between 0 and 100),
  add column if not exists bonus_fee_percent numeric(5, 2) not null default 0,
  add column if not exists bonus_worker      numeric(6, 2) not null default 0;

-- A facility may see the bonus it adds (its own cost) but not the fee or what the worker gets.
grant select (bonus_rate) on public.shifts to authenticated;

-- Facility adds or raises an hourly bonus on one of its open shifts. It can only go up.
create or replace function public.add_shift_bonus(p_shift uuid, p_bonus numeric)
returns void language plpgsql security definer set search_path = public as $$
declare sh public.shifts; fee numeric;
begin
  select s.* into sh from public.shifts s
    join public.facilities f on f.id = s.facility_id
    where s.id = p_shift and f.owner_id = auth.uid()
    for update of s;
  if not found then raise exception 'Shift not found.'; end if;
  if sh.status <> 'open' or sh.starts_at <= now() then
    raise exception 'Bonuses can only be added to open shifts that have not started.';
  end if;
  if p_bonus is null or p_bonus <= 0 or p_bonus > 100 then
    raise exception 'Enter a bonus between $0.01 and $100 per hour.';
  end if;
  if p_bonus <= sh.bonus_rate then
    raise exception 'The bonus can only go up. It is now $% per hour.', sh.bonus_rate;
  end if;
  select a.value into fee from public.app_settings a where a.key = 'bonus_fee_percent';
  if fee is null then raise exception 'Pricing is not set up yet.'; end if;
  update public.shifts
    set bonus_rate = p_bonus, bonus_fee_percent = fee, bonus_worker = round(p_bonus * (1 - fee / 100), 2)
    where id = p_shift;
end;
$$;

-- Staff settings for the bonus fee.
create or replace function public.admin_get_bonus_fee()
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select a.value into v from public.app_settings a where a.key = 'bonus_fee_percent';
  return v;
end;
$$;

create or replace function public.admin_set_bonus_fee(v numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if v is null or v < 0 or v > 60 then raise exception 'Fee must be between 0 and 60 percent.'; end if;
  update public.app_settings set value = v where key = 'bonus_fee_percent';
end;
$$;

-- Worker views now show base rate, bonus, total hourly rate and total pay for the shift.
drop function if exists public.worker_open_shifts();
create function public.worker_open_shifts()
returns table (
  id uuid, facility_type text, role text, starts_at timestamptz, ends_at timestamptz,
  headcount int, spots_left int, base_rate numeric, bonus_pay numeric, total_rate numeric,
  total_pay numeric, notes text
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
         o.worker_rate, o.bonus_worker, o.worker_rate + o.bonus_worker,
         round((o.worker_rate + o.bonus_worker) * extract(epoch from (o.ends_at - o.starts_at)) / 3600, 2),
         o.notes
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

drop function if exists public.worker_my_claims();
create function public.worker_my_claims()
returns table (
  claim_id uuid, claim_status text, shift_id uuid, role text, starts_at timestamptz,
  ends_at timestamptz, base_rate numeric, bonus_pay numeric, total_rate numeric, total_pay numeric,
  shift_status text, facility_name text, facility_type text
)
language sql stable security definer set search_path = public as $$
  select c.id, c.status, s.id, s.role, s.starts_at, s.ends_at, s.worker_rate, s.bonus_worker,
         s.worker_rate + s.bonus_worker,
         round((s.worker_rate + s.bonus_worker) * extract(epoch from (s.ends_at - s.starts_at)) / 3600, 2),
         s.status, case when c.status = 'confirmed' then f.name end, f.facility_type
  from public.shift_claims c
  join public.shifts s on s.id = c.shift_id
  join public.facilities f on f.id = s.facility_id
  where c.worker_id = auth.uid() and c.status <> 'released'
  order by s.starts_at desc
  limit 100;
$$;

-- Staff views include the bonus.
drop function if exists public.admin_list_shifts();
create function public.admin_list_shifts()
returns table (
  id uuid, facility_name text, role text, starts_at timestamptz, ends_at timestamptz,
  headcount int, bill_rate numeric, fee_percent numeric, worker_rate numeric,
  bonus_rate numeric, bonus_fee_percent numeric, bonus_worker numeric,
  status text, notes text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select s.id, f.name, s.role, s.starts_at, s.ends_at, s.headcount, s.bill_rate,
           s.fee_percent, s.worker_rate, s.bonus_rate, s.bonus_fee_percent, s.bonus_worker,
           s.status, s.notes
    from public.shifts s join public.facilities f on f.id = s.facility_id
    order by s.starts_at desc limit 200;
end;
$$;

drop function if exists public.admin_list_claims();
create function public.admin_list_claims()
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
           s.starts_at, s.ends_at, s.worker_rate + s.bonus_worker, s.headcount
    from public.shift_claims c
    join public.worker_profiles w on w.id = c.worker_id
    join public.shifts s on s.id = c.shift_id
    join public.facilities f on f.id = s.facility_id
    where c.status <> 'released'
    order by (c.status = 'claimed') desc, s.starts_at
    limit 200;
end;
$$;

revoke all on function
  public.add_shift_bonus(uuid, numeric), public.admin_get_bonus_fee(), public.admin_set_bonus_fee(numeric),
  public.worker_open_shifts(), public.worker_my_claims(), public.admin_list_shifts(), public.admin_list_claims()
  from public, anon;
grant execute on function
  public.add_shift_bonus(uuid, numeric), public.admin_get_bonus_fee(), public.admin_set_bonus_fee(numeric),
  public.worker_open_shifts(), public.worker_my_claims(), public.admin_list_shifts(), public.admin_list_claims()
  to authenticated;
