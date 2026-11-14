import { NextResponse } from "next/server";
import { createSupabase } from "../../../lib/supabase/server";

// The email link lands here. It trades the one-time token for a login cookie, then opens /admin.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const supabase = await createSupabase();
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (!error) return NextResponse.redirect(`${origin}/admin`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
