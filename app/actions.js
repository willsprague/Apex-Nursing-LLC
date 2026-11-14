"use server";

import { createClient } from "@supabase/supabase-js";

const FACILITY_TYPES = ["Long-term care", "Hospital", "Home health or clinic", "Other"];
const NEEDS = ["Nursing shifts", "Care and support staff", "Both", "Not sure yet"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData, key) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitLead(_prevState, formData) {
  // Hidden field that real visitors never fill in. Bots do. Pretend it worked and save nothing.
  if (text(formData, "website")) {
    return { ok: true, message: "Request received. We will follow up by email." };
  }

  const facility = text(formData, "facility");
  const contact = text(formData, "contact");
  const email = text(formData, "email");
  const facilityType = text(formData, "type");
  const need = text(formData, "need");

  if (!facility || !contact || !email || !facilityType || !need) {
    return { ok: false, message: "Fill in every field, then send the request again." };
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, message: "Enter a valid email address, such as name@facility.com." };
  }
  if (facility.length > 200 || contact.length > 200) {
    return { ok: false, message: "Shorten the facility name or your name and title to 200 characters." };
  }
  if (!FACILITY_TYPES.includes(facilityType) || !NEEDS.includes(need)) {
    return { ok: false, message: "Choose a facility type and a staffing need from the lists." };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      ok: false,
      message: "This form is not connected yet, so nothing was sent. Please try again later.",
    };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("facility_leads").insert({
    facility,
    contact,
    email,
    facility_type: facilityType,
    need,
  });

  if (error) {
    // Log only the error code. Never log what the visitor typed.
    console.error("facility_leads insert failed:", error.code);
    return { ok: false, message: "Your request was not saved. Send it again in a minute." };
  }

  return { ok: true, message: "Request received. We will follow up by email." };
}
