"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabase } from "../../lib/supabase/server";

const STATUSES = ["new", "contacted", "qualified", "closed"];

export async function setStatus(formData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!STATUSES.includes(status) || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabase();
  // The database only allows this if the signed-in user is an admin.
  await supabase.from("facility_leads").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

const APP_STATUSES = ["new", "contacted", "background_check", "health_screening", "approved", "declined"];

export async function setApplicationStatus(formData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!APP_STATUSES.includes(status) || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabase();
  // The database only allows this if the signed-in user is an admin.
  await supabase.from("worker_applications").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setFee(formData) {
  const v = Number(String(formData.get("value") || ""));
  if (!Number.isFinite(v) || v < 0 || v > 60) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_fee", { v });
  revalidatePath("/admin");
}

export async function setRoleMin(formData) {
  const role = String(formData.get("role") || "");
  const v = Number(String(formData.get("value") || ""));
  if (!role || !Number.isFinite(v) || v < 0 || v > 300) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_role_min", { p_role: role, v });
  revalidatePath("/admin");
}

export async function setFacilityVerified(formData) {
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_facility_verified", { target: id, value: formData.get("value") === "true" });
  revalidatePath("/admin");
}

export async function setShiftStatus(formData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["open", "filled", "cancelled"].includes(status)) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_shift_status", { target: id, new_status: status });
  revalidatePath("/admin");
}

export async function setWorkerVerified(formData) {
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_worker_verified", { target: id, value: formData.get("value") === "true" });
  revalidatePath("/admin");
}

export async function setClaimStatus(formData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["confirmed", "released"].includes(status)) return;
  const supabase = await createSupabase();
  await supabase.rpc("admin_set_claim_status", { p_claim: id, p_status: status });
  revalidatePath("/admin");
}
