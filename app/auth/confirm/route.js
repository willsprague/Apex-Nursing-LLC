import { NextResponse } from "next/server";
import { createSupabase } from "../../../lib/supabase/server";

// The email link lands here. It trades the one-time code for a login cookie, then opens
// /admin for staff, /worker or /portal for returning users, and /welcome for new ones. Works with Supabase's default email (?code=)
// and with a custom template that sends ?token_hash=.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  // Only these paths may be requested, so the link can't send people to another site.
  const next = searchParams.get("next") === "/apply" ? "/apply" : null;
  const supabase = await createSupabase();

  let error = new Error("no token");
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" }));

  if (!error) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    let dest = "/welcome";
    if (isAdmin) dest = "/admin";
    else {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: worker }, { data: facility }] = await Promise.all([
        supabase.from("worker_profiles").select("id").eq("id", user.id).maybeSingle(),
        supabase.from("facilities").select("id").eq("owner_id", user.id).maybeSingle(),
      ]);
      if (next) dest = next;
      else if (worker) dest = "/worker";
      else if (facility) dest = "/portal";
    }
    return NextResponse.redirect(`${origin}${dest}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
