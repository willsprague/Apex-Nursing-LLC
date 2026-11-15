import { NextResponse } from "next/server";
import { createSupabase } from "../../../lib/supabase/server";

// The email link lands here. It trades the one-time code for a login cookie, then opens
// /admin for staff or /portal for facilities. Works with Supabase's default email (?code=)
// and with a custom template that sends ?token_hash=.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const supabase = await createSupabase();

  let error = new Error("no token");
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" }));

  if (!error) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    return NextResponse.redirect(`${origin}${isAdmin ? "/admin" : "/portal"}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
