-- Units: a facility lists the units it staffs once (name, floor, type, patient count), then picks one per shift.
-- Shifts are one person each. Nurses can pass on a shift with a reason; the facility only sees totals.

create table if not exists public.facility_units (
  id          uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  floor       text not null default '' check (char_length(floor) <= 30),
  unit_type   text not null default 'Other' check (char_length(unit_type) between 1 and 60),
  patients    int check (patients between 1 and 999),
  created_at  timestamptz not null default now(),
  unique (facility_id, name)
);
alter table public.facility_units enable row level security;
revoke all on public.facility_units from anon, authenticated;
grant select on public.facility_units to authenticated;
drop policy if exists "read own units" on public.facility_units;
create policy "read own units" on public.facility_units for select to authenticated using (
  public.is_admin() or exists (select 1 from public.facilities f where f.id = facility_id and f.owner_id = auth.uid())
);

-- No upper limit on ratios beyond 99, which only catches typos.
alter table public.shifts
  add column if not exists unit_id uuid references public.facility_units (id),
  add column if not exists ratio_to int check (ratio_to between 1 and 99),
  add column if not exists aides_on int check (aides_on between 0 and 99);

-- Passes: why a nurse is not taking a shift.
create table if not exists public.shift_passes (
  id         uuid primary key default gen_random_uuid(),
  shift_id   uuid not null references public.shifts (id) on delete cascade,
  worker_id  uuid not null references public.worker_profiles (id) on delete cascade,
  reasons    text[] not null check (cardinality(reasons) between 1 and 6),
  created_at timestamptz not null default now(),
  unique (shift_id, worker_id)
);
alter table public.shift_passes enable row level security;
revoke all on public.shift_passes from anon, authenticated;

create or replace function public.pass_shift(p_shift uuid, p_reasons text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.worker_profiles w where w.id = auth.uid() and w.verified) then
    raise exception 'Only cleared workers can do this.' using errcode = 'P0001';
  end if;
  if p_reasons is null or cardinality(p_reasons) = 0 or exists (
    select 1 from unnest(p_reasons) r where r not in
      ('Rate too low for the distance', 'Rate too low for the work', 'Ratio too high',
       'Shift time does not work', 'Too far', 'Something else')) then
    raise exception 'Pick at least one reason.' using errcode = 'P0001';
  end if;
  insert into public.shift_passes (shift_id, worker_id, reasons) values (p_shift, auth.uid(), p_reasons)
  on conflict (shift_id, worker_id) do update set reasons = excluded.reasons;
end;
$$;

-- Facility owners see only totals per reason, never who passed.
create or replace function public.facility_pass_totals(p_shift uuid)
returns table (reason text, nurses bigint)
language sql stable security definer set search_path = public as $$
  select r, count(*) from public.shift_passes p
  join public.shifts s on s.id = p.shift_id
  join public.facilities f on f.id = s.facility_id and f.owner_id = auth.uid()
  cross join lateral unnest(p.reasons) r
  where p.shift_id = p_shift
  group by r order by 2 desc;
$$;

-- Open shifts now show the unit, ratio and aides, and hide shifts this nurse passed on.
drop function if exists public.worker_open_shifts();
create function public.worker_open_shifts()
returns table (
  id uuid, facility_type text, role text, starts_at timestamptz, ends_at timestamptz,
  headcount int, spots_left int, base_rate numeric, bonus_pay numeric, total_rate numeric,
  total_pay numeric, notes text,
  unit_name text, unit_floor text, unit_type text, patients int, ratio_to int, aides_on int
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
         o.notes, u.name, u.floor, u.unit_type, u.patients, o.ratio_to, o.aides_on
  from open_shifts o
  join me on me.role = o.role
  join public.facilities f on f.id = o.facility_id
  left join public.facility_units u on u.id = o.unit_id
  where o.left_count > 0
    and not exists (
      select 1 from public.shift_claims c
      where c.shift_id = o.id and c.worker_id = me.id and c.status in ('claimed', 'confirmed')
    )
    and not exists (select 1 from public.shift_passes p where p.shift_id = o.id and p.worker_id = me.id)
  order by o.starts_at
  limit 100;
$$;

revoke all on function public.pass_shift(uuid, text[]), public.facility_pass_totals(uuid), public.worker_open_shifts() from public, anon;
grant execute on function public.pass_shift(uuid, text[]), public.facility_pass_totals(uuid), public.worker_open_shifts() to authenticated;
