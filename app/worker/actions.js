"use server";

import { revalidatePath } from "next/cache";
import { createSupabase } from "../../lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

function text(fd, k) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

// Messages written by our own database rules are safe to show. Anything else gets a generic message.
function friendly(error, fallback) {
  return error && error.code === "P0001" ? error.message : fallback;
}

export async function registerWorker(_prev, fd) {
  const name = text(fd, "name");
  const role = text(fd, "role");
  const license = text(fd, "license");
  if (!name || !role || !license || name.length > 100 || license.length > 40) {
    return { ok: false, message: "Fill in your name, role and license number." };
  }
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("register_worker", { p_name: name, p_role: role, p_license: license });
  if (error) return { ok: false, message: friendly(error, "Could not save your account. Try again.") };
  revalidatePath("/worker");
  return { ok: true, message: "Saved." };
}

export async function claimShift(fd) {
  const id = text(fd, "id");
  if (!UUID.test(id)) return;
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("claim_shift", { p_shift: id });
  if (error) console.error("claim failed:", error.code);
  revalidatePath("/worker");
}

export async function withdrawClaim(fd) {
  const id = text(fd, "id");
  if (!UUID.test(id)) return;
  const supabase = await createSupabase();
  const { error } = await supabase.rpc("withdraw_claim", { p_claim: id });
  if (error) console.error("withdraw failed:", error.code);
  revalidatePath("/worker");
}
