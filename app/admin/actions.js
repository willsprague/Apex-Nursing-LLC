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

export async function signOut() {
  const supabase = await createSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
