-- Facilities add units once, then post shifts against them. Each shift is one person:
-- asking for 3 nurses posts 3 separate shifts, each its own agreement.

create or replace function public.add_unit(p_name text, p_floor text, p_type text, p_patients int)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; new_id uuid;
begin
  select id into fid from public.facilities where owner_id = auth.uid() and verified;
  if fid is null then raise exception 'Your facility has not been verified yet.' using errcode = 'P0001'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'Enter the unit name.' using errcode = 'P0001';
  end if;
  if p_patients is null or p_patients < 1 or p_patients > 999 then
    raise exception 'Enter how many patients the unit has.' using errcode = 'P0001';
  end if;
  insert into public.facility_units (facility_id, name, floor, unit_type, patients)
  values (fid, trim(p_name), trim(coalesce(p_floor, '')), coalesce(nullif(trim(p_type), ''), 'Other'), p_patients)
  on conflict (facility_id, name) do update
    set floor = excluded.floor, unit_type = excluded.unit_type, patients = excluded.patients
  returning id into new_id;
  return new_id;
end;
$$;

drop function if exists public.create_shift(text, date, time, time, int, numeric, text);
create function public.create_shift(
  p_role text, p_date date, p_start time, p_end time,
  p_people int, p_bill_rate numeric, p_notes text,
  p_unit uuid, p_ratio int, p_aides int
) returns int language plpgsql security definer set search_path = public as $$
declare
  fid uuid; s timestamptz; e timestamptz; fee numeric; minrate numeric;
begin
  select id into fid from public.facilities where owner_id = auth.uid() and verified;
  if fid is null then raise exception 'Your facility has not been verified yet.' using errcode = 'P0001'; end if;

  select min_bill_rate into minrate from public.shift_roles where role = p_role;
  if not found then raise exception 'Choose a role from the list.' using errcode = 'P0001'; end if;
  if p_bill_rate is null or p_bill_rate < greatest(minrate, 10) or p_bill_rate > 300 then
    raise exception 'The hourly rate for this role must be at least $% and no more than $300.',
      greatest(minrate, 10) using errcode = 'P0001';
  end if;
  if p_people is null or p_people < 1 or p_people > 20 then
    raise exception 'Choose between 1 and 20 people.' using errcode = 'P0001';
  end if;
  if p_unit is null or not exists (select 1 from public.facility_units u where u.id = p_unit and u.facility_id = fid) then
    raise exception 'Choose the unit this shift is on.' using errcode = 'P0001';
  end if;
  if p_ratio is null or p_ratio < 1 or p_ratio > 99 then
    raise exception 'Enter the ratio, nurse to patients (1 to 99).' using errcode = 'P0001';
  end if;
  if p_aides is not null and (p_aides < 0 or p_aides > 99) then
    raise exception 'Enter how many aides are on (0 to 99).' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_notes, '')) > 300 then raise exception 'Keep notes to 300 characters.' using errcode = 'P0001'; end if;

  s := (p_date + p_start) at time zone 'America/New_York';
  e := (p_date + p_end) at time zone 'America/New_York';
  if p_end <= p_start then e := e + interval '1 day'; end if;
  if s <= now() then raise exception 'The shift must start in the future.' using errcode = 'P0001'; end if;
  if e - s > interval '16 hours' then raise exception 'Shifts can be at most 16 hours.' using errcode = 'P0001'; end if;

  select value into fee from public.app_settings where key = 'fee_percent';
  if fee is null then raise exception 'Pricing is not set up yet.' using errcode = 'P0001'; end if;

  insert into public.shifts
    (facility_id, role, starts_at, ends_at, headcount, bill_rate, fee_percent, worker_rate, notes,
     unit_id, ratio_to, aides_on)
  select fid, p_role, s, e, 1, p_bill_rate, fee, round(p_bill_rate * (1 - fee / 100), 2),
         coalesce(trim(p_notes), ''), p_unit, p_ratio, p_aides
  from generate_series(1, p_people);
  return p_people;
end;
$$;

revoke all on function public.add_unit(text, text, text, int),
  public.create_shift(text, date, time, time, int, numeric, text, uuid, int, int) from public, anon;
grant execute on function public.add_unit(text, text, text, int),
  public.create_shift(text, date, time, time, int, numeric, text, uuid, int, int) to authenticated;
