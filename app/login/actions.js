"use server";

import { headers } from "next/headers";
import { createSupabase } from "../../lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendLink(_prev, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const next = String(formData.get("next") || "") === "/apply" ? "?next=/apply" : "";
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  const supabase = await createSupabase();
  // New facilities create their account by signing in. A new account can do nothing until
  // staff verify its facility, and /admin only opens for emails on the admins list.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${proto}://${host}/auth/confirm${next}` },
  });
  if (error) console.error("sign-in link failed:", error.code || error.status);
  // Same answer whether or not the email exists, so strangers can't test which emails are admins.
  return { ok: true, message: "If that email has access, a sign-in link is on its way." };
}
