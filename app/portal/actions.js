"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabase } from "../../lib/supabase/server";

const TYPES = ["Long-term care", "Hospital", "Home health or clinic", "Other"];

function text(fd, k) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

// Messages written by our own database rules are safe to show. Anything else gets a generic message.
function friendly(error, fallback) {
  return error && error.code === "P0001" ? error.message : fallback;
}

export async function registerFacility(_prev, fd) {
  const name = text(fd, "name");
  const type = text(fd, "type");
  const contact = text(fd, "contact");
  if (!name || !contact || !TYPES.includes(type) || name.length > 200 || contact.length > 200) {
    return { ok: false, message: "Fill in the facility name, type and your name (200 characters or fewer)." };
  }
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("register_facility", { p_name: name, p_type: type, p_contact: contact });
  if (error) return { ok: false, message: friendly(error, "Could not save your facility. Try again.") };
  revalidatePath("/portal");
  return { ok: true, message: "Saved." };
}

export async function postShift(_prev, fd) {
  const date = text(fd, "date");
  const start = text(fd, "start");
  const end = text(fd, "end");
  const role = text(fd, "role");
  const people = Number(text(fd, "people"));
  const rate = Number(text(fd, "rate"));
  const unit = text(fd, "unit");
  const ratio = Number(text(fd, "ratio"));
  const aidesRaw = text(fd, "aides");
  const aides = aidesRaw === "" ? null : Number(aidesRaw);
  const notes = text(fd, "notes");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || !role) {
    return { ok: false, message: "Choose a role, date, start time and end time." };
  }
  if (!Number.isInteger(people) || !(rate > 0)) {
    return { ok: false, message: "Enter how many people you need and an hourly rate." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(unit)) return { ok: false, message: "Choose the unit, or add one first." };
  if (!Number.isInteger(ratio) || ratio < 1 || ratio > 99) {
    return { ok: false, message: "Enter the ratio as the number of patients per nurse (1 to 99)." };
  }
  if (aides !== null && (!Number.isInteger(aides) || aides < 0 || aides > 99)) {
    return { ok: false, message: "Aides on must be a whole number from 0 to 99." };
  }
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("create_shift", {
    p_role: role, p_date: date, p_start: start, p_end: end,
    p_people: people, p_bill_rate: rate, p_notes: notes,
    p_unit: unit, p_ratio: ratio, p_aides: aides,
  });
  if (error) return { ok: false, message: friendly(error, "The shift was not saved. Try again.") };
  revalidatePath("/portal");
  return { ok: true, message: people > 1 ? `${people} shifts posted, one per person.` : "Shift posted." };
}

export async function addUnit(_prev, fd) {
  const patients = Number(text(fd, "patients"));
  const name = text(fd, "name");
  if (!name || !Number.isInteger(patients) || patients < 1) return { ok: false, message: "Enter the unit name and how many patients it has." };
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("add_unit", {
    p_name: name, p_floor: text(fd, "floor"), p_type: text(fd, "type"), p_patients: patients,
  });
  if (error) return { ok: false, message: friendly(error, "The unit was not saved. Try again.") };
  revalidatePath("/portal");
  return { ok: true, message: "Unit saved." };
}

export async function cancelShift(fd) {
  const id = text(fd, "id");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("cancel_shift", { p_id: id });
  if (error) redirect(`/portal?error=${encodeURIComponent(friendly(error, "Could not cancel the shift. Try again."))}`);
  revalidatePath("/portal");
}

export async function addBonus(fd) {
  const id = text(fd, "id");
  const bonus = Number(text(fd, "bonus"));
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(bonus > 0)) {
    redirect(`/portal?error=${encodeURIComponent("Enter a bonus amount in dollars per hour.")}`);
  }
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("add_shift_bonus", { p_shift: id, p_bonus: bonus });
  if (error) redirect(`/portal?error=${encodeURIComponent(friendly(error, "Could not add the bonus. Try again."))}`);
  revalidatePath("/portal");
}
