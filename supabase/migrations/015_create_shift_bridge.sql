-- Bridge for the older website form (no unit or ratio): posts one-person shifts with no unit.
-- Remove once every client sends the new create_shift fields.
create or replace function public.create_shift(
  p_role text, p_date date, p_start time, p_end time,
  p_headcount int, p_bill_rate numeric, p_notes text
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
  if p_headcount is null or p_headcount < 1 or p_headcount > 20 then
    raise exception 'Choose between 1 and 20 people.' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_notes, '')) > 300 then raise exception 'Keep notes to 300 characters.' using errcode = 'P0001'; end if;
  s := (p_date + p_start) at time zone 'America/New_York';
  e := (p_date + p_end) at time zone 'America/New_York';
  if p_end <= p_start then e := e + interval '1 day'; end if;
  if s <= now() then raise exception 'The shift must start in the future.' using errcode = 'P0001'; end if;
  if e - s > interval '16 hours' then raise exception 'Shifts can be at most 16 hours.' using errcode = 'P0001'; end if;
  select value into fee from public.app_settings where key = 'fee_percent';
  if fee is null then raise exception 'Pricing is not set up yet.' using errcode = 'P0001'; end if;
  insert into public.shifts (facility_id, role, starts_at, ends_at, headcount, bill_rate, fee_percent, worker_rate, notes)
  select fid, p_role, s, e, 1, p_bill_rate, fee, round(p_bill_rate * (1 - fee / 100), 2), coalesce(trim(p_notes), '')
  from generate_series(1, p_headcount);
  return p_headcount;
end;
$$;
revoke all on function public.create_shift(text, date, time, time, int, numeric, text) from public, anon;
grant execute on function public.create_shift(text, date, time, time, int, numeric, text) to authenticated;
