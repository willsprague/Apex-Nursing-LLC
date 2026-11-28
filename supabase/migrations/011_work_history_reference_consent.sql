-- Work history and reference permission on the application (backlog US-553).
-- Run once in the Supabase SQL Editor after 010: New query > paste > Run.
-- work_history is a short list of up to three recent jobs (employer, job title, start and end).
-- reference_consent records that the applicant agreed we may contact the references and past employers listed.
-- Older applications keep an empty list and false, so nothing breaks for them.

alter table public.worker_applications
  add column if not exists work_history jsonb not null default '[]'::jsonb,
  add column if not exists reference_consent boolean not null default false;

alter table public.worker_applications drop constraint if exists worker_applications_work_history_check;
alter table public.worker_applications
  add constraint worker_applications_work_history_check
  check (jsonb_typeof(work_history) = 'array' and jsonb_array_length(work_history) <= 3);

-- Applicants can read their own row and staff read all of them (same as the other columns).
grant select (work_history, reference_consent) on public.worker_applications to authenticated;

-- The phone sends the same fields through this function.
create or replace function public.submit_application(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); mail text; wh jsonb := coalesce(p->'work_history', '[]'::jsonb); j jsonb;
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
  if coalesce((p->>'reference_consent')::boolean, false) is not true then
    raise exception 'Check the box so we can contact your references and past employers.';
  end if;
  if (p->>'phone') !~ '^[0-9+()\-.\s]{7,30}$' then
    raise exception 'Enter a phone number we can reach you on.';
  end if;
  if jsonb_typeof(wh) <> 'array' or jsonb_array_length(wh) < 1 or jsonb_array_length(wh) > 3 then
    raise exception 'Add your most recent job (up to three).';
  end if;
  for j in select * from jsonb_array_elements(wh) loop
    if coalesce(trim(j->>'employer'), '') = '' or coalesce(trim(j->>'title'), '') = ''
       or coalesce(trim(j->>'from'), '') = '' or coalesce(trim(j->>'to'), '') = ''
       or char_length(j->>'employer') > 100 or char_length(j->>'title') > 100
       or char_length(j->>'from') > 30 or char_length(j->>'to') > 30 then
      raise exception 'Fill in the employer, job title, start and end for each job.';
    end if;
  end loop;
  insert into public.worker_applications (
    user_id, full_name, email, phone, role, license_state, license_number, years_experience, town,
    license_disciplined, id_types,
    ref1_name, ref1_relationship, ref1_contact, ref2_name, ref2_relationship, ref2_contact,
    settings, availability, consent, work_history, reference_consent
  ) values (
    uid, trim(p->>'full_name'), mail, trim(p->>'phone'), trim(p->>'role'), trim(p->>'license_state'),
    trim(p->>'license_number'), p->>'years_experience', trim(p->>'town'),
    (p->>'license_disciplined')::boolean, p->>'id_types',
    trim(p->>'ref1_name'), p->>'ref1_relationship', trim(p->>'ref1_contact'),
    trim(p->>'ref2_name'), p->>'ref2_relationship', trim(p->>'ref2_contact'),
    coalesce(p->>'settings', ''), p->>'availability', true, wh, true
  );
exception
  when check_violation or not_null_violation then
    raise exception 'Fill in every field, then send the application again.';
end;
$$;

revoke all on function public.submit_application(jsonb) from public, anon;
grant execute on function public.submit_application(jsonb) to authenticated;
