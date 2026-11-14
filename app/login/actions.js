"use server";

import { headers } from "next/headers";
import { createSupabase } from "../../lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendLink(_prev, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const supabase = await createSupabase();
  // shouldCreateUser: false means only accounts you created in Supabase can get a link.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) console.error("sign-in link failed:", error.code || error.status);
  // Same answer whether or not the email exists, so strangers can't test which emails are admins.
  return { ok: true, message: "If that email has access, a sign-in link is on its way." };
}
