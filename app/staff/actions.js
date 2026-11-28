"use server";

import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NO = { ok: false, message: "That email and password did not work." };

// Staff sign in with a password, so email delivery limits can never lock them out.
// Only emails on the admins list get in. Everyone else is signed straight back out,
// and the answer is the same whether the email exists or not.
export async function staffSignIn(_prev, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!EMAIL.test(email) || email.length > 254 || password.length < 1 || password.length > 200) return NO;
  const supabase = await createSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NO;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return NO;
  }
  redirect("/admin");
}
