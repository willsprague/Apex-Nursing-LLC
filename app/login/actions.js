"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destinationFor } from "../auth/destination";
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
  return { ok: true, sent: true, email, next: next ? "/apply" : "", message: "Check your email. Enter the code from it below, or tap the link." };
}

export async function verifyCode(_prev, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("code") || "").replace(/\s/g, "");
  const next = String(formData.get("next") || "") === "/apply" ? "/apply" : null;
  if (!EMAIL.test(email) || !/^[0-9]{4,10}$/.test(token)) {
    return { ok: true, sent: true, email, next: next || "", message: "Enter the numbers from the email." };
  }
  const supabase = await createSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { ok: true, sent: true, email, next: next || "", message: "That code did not work. Check it, or send a new one." };
  redirect(await destinationFor(supabase, next));
}
