import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome", robots: { index: false, follow: false } };

export default async function Welcome() {
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <main><section><div className="wrap">
      <h2>Welcome to Apixora</h2>
      <p className="lead">How will you use Apixora?</p>
      <p><a className="btn" href="/portal">I am a facility that needs staff</a></p>
      <p><a className="btn alt" href="/apply">I am a nurse or aide looking for shifts</a></p>
    </div></section></main>
  );
}
