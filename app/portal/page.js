import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";
import { signOut } from "../admin/actions";
import { cancelShift } from "./actions";
import RegisterForm from "./RegisterForm";
import ShiftForm from "./ShiftForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facility portal", robots: { index: false, follow: false } };

function fmt(iso) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function Portal({ searchParams }) {
  const { error: actionError } = await searchParams;
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: facility } = await supabase
    .from("facilities").select("id, name, verified").eq("owner_id", user.id).maybeSingle();

  const shell = (children) => (
    <main><section><div className="wrap">
      {children}
      <form action={signOut} style={{ marginTop: 24 }}>
        <button className="btn alt" type="submit">Sign out</button>
      </form>
    </div></section></main>
  );

  if (!facility) {
    return shell(<>
      <h2>Register your facility</h2>
      <p className="lead">Tell us about your facility. We verify every facility before it can post shifts.</p>
      <RegisterForm />
    </>);
  }
  if (!facility.verified) {
    return shell(<>
      <h2>{facility.name}</h2>
      <p className="lead">Thanks. We are verifying your facility and will email you when you can post shifts.</p>
    </>);
  }

  const [{ data: roles }, { data: shifts }] = await Promise.all([
    supabase.from("shift_roles").select("role, min_bill_rate").order("role"),
    supabase.from("shifts")
      .select("id, role, starts_at, ends_at, headcount, bill_rate, status, notes")
      .order("starts_at", { ascending: false }).limit(100),
  ]);

  return shell(<>
    {actionError && <p role="alert" style={{ color: "#f2b8b5", fontWeight: 600 }}>{String(actionError).slice(0, 300)}</p>}
    <h2>{facility.name}</h2>
    <h3>Post a shift</h3>
    <ShiftForm roles={roles || []} />
    <h3 style={{ marginTop: 32 }}>Your shifts</h3>
    {(shifts || []).length === 0 && <p>No shifts yet.</p>}
    {(shifts || []).map((s) => (
      <form key={s.id} action={cancelShift} style={{ display: "block", padding: 8, borderBottom: "1px solid #ddd" }}>
        <input type="hidden" name="id" value={s.id} />
        <b>{s.role}</b> x{s.headcount}, {fmt(s.starts_at)} to {fmt(s.ends_at)}
        <br />
        You pay ${s.bill_rate}/hr. Status: {s.status}
        {s.status === "open" && <button type="submit" style={{ marginLeft: 12 }}>Cancel shift</button>}
      </form>
    ))}
    <p><small>Shifts can be cancelled here more than 24 hours before they start. Closer than that, contact us.</small></p>
  </>);
}
