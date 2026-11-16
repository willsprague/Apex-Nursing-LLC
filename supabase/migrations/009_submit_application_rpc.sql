-- Lets the mobile app send a worker application (backlog US-537).
-- Run once in the Supabase SQL Editor after 008: New query > paste > Run.
-- The website saves applications from its server using the service role key. A phone must never hold
-- that key, so this function does the same insert for the signed-in user only. The email comes from
-- the account, and a person can send one application (a second attempt raises a friendly error).

create or replace function public.submit_application(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); mail text;
begin
  if uid is null then raise exception 'Sign in first.'; end if;
  select lower(u.email) into mail from auth.users u where u.id = uid;
  if mail is null then raise exception 'Your account has no email address.'; end if;
  if exists (select 1 from public.worker_applications a where a.user_id = uid) then
    raise exception 'You already sent an application.';
  end if;
  if coalesce((p->>'consent')::boolean, false) is not true then
    raise exception 'Check the box so we can contact you and look up your license.';
  end if;
  if (p->>'phone') !~ '^[0-9+()\-.\s]{7,30}$' then
    raise exception 'Enter a phone number we can reach you on.';
  end if;
  insert into public.worker_applications (
    user_id, full_name, email, phone, role, license_state, license_number, years_experience, town,
    license_disciplined, id_types,
    ref1_name, ref1_relationship, ref1_contact, ref2_name, ref2_relationship, ref2_contact,
    settings, availability, consent
  ) values (
    uid, trim(p->>'full_name'), mail, trim(p->>'phone'), trim(p->>'role'), trim(p->>'license_state'),
    trim(p->>'license_number'), p->>'years_experience', trim(p->>'town'),
    (p->>'license_disciplined')::boolean, p->>'id_types',
    trim(p->>'ref1_name'), p->>'ref1_relationship', trim(p->>'ref1_contact'),
    trim(p->>'ref2_name'), p->>'ref2_relationship', trim(p->>'ref2_contact'),
    coalesce(p->>'settings', ''), p->>'availability', true
  );
exception
  when check_violation or not_null_violation then
    raise exception 'Fill in every field, then send the application again.';
end;
$$;

revoke all on function public.submit_application(jsonb) from public, anon;
grant execute on function public.submit_application(jsonb) to authenticated;
