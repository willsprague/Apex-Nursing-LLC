-- Facilities must not see the Apixora fee or the worker rate (backlog US-514).
-- Run once in Supabase after 004: SQL Editor > New query > paste > Run.
-- Deploy the matching website update first or right after; the admin page reads through the functions below.

-- Facilities (and any signed-in user) can read only these shift columns.
revoke select on public.shifts from authenticated;
grant select (id, created_at, facility_id, role, starts_at, ends_at, headcount, bill_rate, notes, status)
  on public.shifts to authenticated;

-- The fee setting is no longer readable by signed-in users. Staff read it through a function.
revoke select on public.app_settings from authenticated;

create or replace function public.admin_get_fee()
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select s.value into v from public.app_settings s where s.key = 'fee_percent';
  return v;
end;
$$;

-- Staff see every shift with the fee and worker rate.
create or replace function public.admin_list_shifts()
returns table (
  id uuid, facility_name text, role text, starts_at timestamptz, ends_at timestamptz,
  headcount int, bill_rate numeric, fee_percent numeric, worker_rate numeric,
  status text, notes text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query
    select s.id, f.name, s.role, s.starts_at, s.ends_at, s.headcount, s.bill_rate,
           s.fee_percent, s.worker_rate, s.status, s.notes
    from public.shifts s join public.facilities f on f.id = s.facility_id
    order by s.starts_at desc limit 200;
end;
$$;

revoke all on function public.admin_get_fee(), public.admin_list_shifts() from public, anon;
grant execute on function public.admin_get_fee(), public.admin_list_shifts() to authenticated;
