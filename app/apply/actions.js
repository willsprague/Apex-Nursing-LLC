"use server";

import { createClient } from "@supabase/supabase-js";

export const APPLY_ROLES = [
  "Registered nurse (RN)",
  "Licensed practical nurse (LPN)",
  "Licensed nursing assistant (LNA)",
  "Dietary aide",
  "Housekeeping",
  "Activities aide",
  "Other",
];
export const EXPERIENCE = ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "More than 10 years"];
export const ID_TYPES = [
  "Driver's license or state ID",
  "U.S. passport",
  "Social Security card",
  "Birth certificate",
  "Permanent resident card",
  "Work permit (employment authorization)",
];
export const SETTINGS = ["Long-term care", "Hospital", "Home health or clinic"];
export const AVAILABILITY = ["Days", "Evenings", "Nights", "Weekends", "Any shift"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(fd, key) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitApplication(_prev, fd) {
  // Hidden field that only bots fill in. Pretend it worked and save nothing.
  if (text(fd, "website")) return { ok: true, message: "Application received." };

  const full_name = text(fd, "name");
  const email = text(fd, "email").toLowerCase();
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

  if (!full_name || !email || !phone || !role || !license_state || !license_number || !years_experience || !town) {
    return { ok: false, message: "Fill in every field, then send the application again." };
  }
  if (refs.some((r) => !r.name || !r.rel || !r.contact)) {
    return { ok: false, message: "Give two references with a name, how you know them, and a phone or email." };
  }
  if (refs.some((r) => r.name.length > 100 || r.rel.length > 100 || r.contact.length > 254)) {
    return { ok: false, message: "One of the reference answers is too long. Shorten it and try again." };
  }
  if (!["yes", "no"].includes(disciplined)) {
    return { ok: false, message: "Answer the question about license discipline." };
  }
  if (!idTypes.length || !idTypes.every((s) => ID_TYPES.includes(s))) {
    return { ok: false, message: "Choose the forms of ID you can show when you are hired." };
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, message: "Enter a valid email address, such as name@example.com." };
  }
  if (!/^[0-9+()\-.\s]{7,30}$/.test(phone)) {
    return { ok: false, message: "Enter a phone number we can reach you on." };
  }
  if (full_name.length > 100 || town.length > 100 || license_number.length > 40 || license_state.length > 40) {
    return { ok: false, message: "One of the answers is too long. Shorten it and try again." };
  }
  if (!APPLY_ROLES.includes(role) || !EXPERIENCE.includes(years_experience)) {
    return { ok: false, message: "Choose your role and experience from the lists." };
  }
  if (!settings.length || !settings.every((s) => SETTINGS.includes(s))) {
    return { ok: false, message: "Choose at least one kind of facility you want to work in." };
  }
  if (!availability.length || !availability.every((s) => AVAILABILITY.includes(s))) {
    return { ok: false, message: "Choose when you are available." };
  }
  if (!consent) {
    return { ok: false, message: "Check the box so we can contact you and look up your license." };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, message: "This form is not connected yet, so nothing was sent. Please try again later." };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("worker_applications").insert({
    full_name, email, phone, role, license_state, license_number, years_experience, town,
    license_disciplined: disciplined === "yes",
    id_types: idTypes.join(", "),
    ref1_name: refs[0].name, ref1_relationship: refs[0].rel, ref1_contact: refs[0].contact,
    ref2_name: refs[1].name, ref2_relationship: refs[1].rel, ref2_contact: refs[1].contact,
    settings: settings.join(", "),
    availability: availability.join(", "),
    consent,
  });
  if (error) {
    // Log only the error code, never what the applicant typed.
    console.error("worker_applications insert failed:", error.code);
    return { ok: false, message: "Your application was not saved. Send it again in a minute." };
  }
  return {
    ok: true,
    message: "Application received. We will review it and email you about next steps, usually within a few business days.",
  };
}
