"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabase } from "../../lib/supabase/server";
import { APPLY_ROLES, EXPERIENCE, ID_TYPES, SETTINGS, AVAILABILITY, REFERENCE_RELATIONSHIPS } from "./options";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(fd, key) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitApplication(_prev, fd) {
  // Hidden field that only bots fill in. Pretend it worked and save nothing.
  if (text(fd, "website")) redirect("/apply/thanks");

  // The application belongs to a signed-in account. The email comes from that account.
  const session = await createSupabase();
  const { data: { user } } = await session.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, message: "Your sign-in expired. Create your account or sign in again, then apply." };
  }
  const email = user.email.toLowerCase();
  const full_name = text(fd, "name");
  const phone = text(fd, "phone");
  const role = text(fd, "role");
  const license_state = text(fd, "licenseState");
  const license_number = text(fd, "license");
  const years_experience = text(fd, "experience");
  const town = text(fd, "town");
  const settings = fd.getAll("settings").filter((s) => typeof s === "string");
  const availability = fd.getAll("availability").filter((s) => typeof s === "string");
  const idTypes = fd.getAll("idTypes").filter((s) => typeof s === "string");
  const disciplined = text(fd, "disciplined");
  const refs = [1, 2].map((n) => ({
    name: text(fd, `ref${n}Name`), rel: text(fd, `ref${n}Rel`), contact: text(fd, `ref${n}Contact`),
  }));
  const consent = fd.get("consent") === "on";
  const referenceConsent = fd.get("referenceConsent") === "on";
  const jobs = [1, 2, 3].map((n) => ({
    employer: text(fd, `job${n}Employer`), title: text(fd, `job${n}Title`),
    from: text(fd, `job${n}From`), to: text(fd, `job${n}To`),
  }));

  // Sent back with any error so the form keeps what the person typed.
  const values = {
    name: full_name, phone, role, licenseState: license_state, license: license_number,
    experience: years_experience, town, disciplined, settings, availability, idTypes, consent, referenceConsent,
    job1Employer: jobs[0].employer, job1Title: jobs[0].title, job1From: jobs[0].from, job1To: jobs[0].to,
    job2Employer: jobs[1].employer, job2Title: jobs[1].title, job2From: jobs[1].from, job2To: jobs[1].to,
    job3Employer: jobs[2].employer, job3Title: jobs[2].title, job3From: jobs[2].from, job3To: jobs[2].to,
    ref1Name: refs[0].name, ref1Rel: refs[0].rel, ref1Contact: refs[0].contact,
    ref2Name: refs[1].name, ref2Rel: refs[1].rel, ref2Contact: refs[1].contact,
  };
  const fail = (message) => ({ ok: false, message, values });

  if (!full_name || !email || !phone || !role || !license_state || !license_number || !years_experience || !town) {
    return fail("Fill in every field, then send the application again.");
  }
  if (refs.some((r) => !r.name || !r.rel || !r.contact)) {
    return fail("Give two references with a name, a professional relationship, and a phone or email.");
  }
  if (refs.some((r) => r.name.length > 100 || r.rel.length > 100 || r.contact.length > 254)) {
    return fail("One of the reference answers is too long. Shorten it and try again.");
  }
  if (refs.some((r) => !REFERENCE_RELATIONSHIPS.includes(r.rel))) {
    return fail("Choose each reference's professional relationship from the list.");
  }
  // Job 1 is required. Jobs 2 and 3 are optional, but a started job must be complete.
  const started = jobs.filter((j) => j.employer || j.title || j.from || j.to);
  if (!jobs[0].employer || !jobs[0].title || !jobs[0].from || !jobs[0].to) {
    return fail("Add your most recent job with the employer, job title, and when you started and ended.");
  }
  if (started.some((j) => !j.employer || !j.title || !j.from || !j.to)) {
    return fail("Finish each job you started: employer, job title, start and end.");
  }
  if (started.some((j) => j.employer.length > 100 || j.title.length > 100 || j.from.length > 30 || j.to.length > 30)) {
    return fail("One of the job answers is too long. Shorten it and try again.");
  }
  if (!["yes", "no"].includes(disciplined)) {
    return fail("Answer the question about license discipline.");
  }
  if (!idTypes.length || !idTypes.every((s) => ID_TYPES.includes(s))) {
    return fail("Choose the forms of ID you can show when you are hired.");
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return fail("Enter a valid email address, such as name@example.com.");
  }
  if (!/^[0-9+()\-.\s]{7,30}$/.test(phone)) {
    return fail("Enter a phone number we can reach you on.");
  }
  if (full_name.length > 100 || town.length > 100 || license_number.length > 40 || license_state.length > 40) {
    return fail("One of the answers is too long. Shorten it and try again.");
  }
  if (!APPLY_ROLES.includes(role) || !EXPERIENCE.includes(years_experience)) {
    return fail("Choose your role and experience from the lists.");
  }
  if (!settings.length || !settings.every((s) => SETTINGS.includes(s))) {
    return fail("Choose at least one kind of facility you want to work in.");
  }
  if (!availability.length || !availability.every((s) => AVAILABILITY.includes(s))) {
    return fail("Choose when you are available.");
  }
  if (!consent) {
    return fail("Check the box so we can contact you and look up your license.");
  }

  if (!referenceConsent) {
    return fail("Check the box so we can contact your references and past employers.");
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return fail("This form is not connected yet, so nothing was sent. Please try again later.");
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("worker_applications").insert({
    user_id: user.id, full_name, email, phone, role, license_state, license_number, years_experience, town,
    license_disciplined: disciplined === "yes",
    id_types: idTypes.join(", "),
    ref1_name: refs[0].name, ref1_relationship: refs[0].rel, ref1_contact: refs[0].contact,
    ref2_name: refs[1].name, ref2_relationship: refs[1].rel, ref2_contact: refs[1].contact,
    settings: settings.join(", "),
    availability: availability.join(", "),
    consent,
    work_history: started,
    reference_consent: true,
  });
  if (error?.code === "23505") {
    redirect("/apply");
  }
  if (error) {
    // Log only the error code, never what the applicant typed.
    console.error("worker_applications insert failed:", error.code);
    return fail("Your application was not saved. Send it again in a minute.");
  }
  redirect("/apply/thanks");
}
