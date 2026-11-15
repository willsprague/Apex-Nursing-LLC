import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";
import { signOut } from "../admin/actions";
import { claimShift, withdrawClaim } from "./actions";
import RegisterWorkerForm from "./RegisterWorkerForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Worker portal", robots: { index: false, follow: false } };

function fmt(iso) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function hours(a, b) {
  return Math.round(((new Date(b) - new Date(a)) / 3600000) * 100) / 100;
}

function Pay({ base, bonus, total, totalPay, start, end }) {
  const b = Number(bonus) > 0;
  return (
    <>
      You earn{" "}
      {b && <s style={{ opacity: 0.6 }}>${base}/hr</s>}{" "}
      <b>${total}/hr</b>{b ? ` (includes a $${bonus}/hr facility bonus)` : ""}.
      <br />
      About ${totalPay} total for {hours(start, end)} hours.
    </>
  );
}

const LABEL = { claimed: "Waiting for our confirmation", confirmed: "Confirmed" };

export default async function Worker() {
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("worker_profiles").select("id, display_name, role, verified").eq("id", user.id).maybeSingle();

  const shell = (children) => (
    <main><section><div className="wrap">
      {children}
      <form action={signOut} style={{ marginTop: 24 }}>
        <button className="btn alt" type="submit">Sign out</button>
      </form>
    </div></section></main>
  );

  if (!me) {
    const { data: roles } = await supabase.from("shift_roles").select("role").order("role");
    return shell(<>
      <h2>Create your worker account</h2>
      <p className="lead">Tell us your role and license. We verify every worker before they can claim shifts.</p>
      <RegisterWorkerForm roles={(roles || []).map((r) => r.role)} />
    </>);
  }
  if (!me.verified) {
    return shell(<>
      <h2>Welcome, {me.display_name}</h2>
      <p className="lead">Thanks. We are checking your license and will email you when you can claim shifts.</p>
    </>);
  }

  const [{ data: open }, { data: mine }] = await Promise.all([
    supabase.rpc("worker_open_shifts"),
    supabase.rpc("worker_my_claims"),
  ]);

  return shell(<>
    <h2>Open shifts for {me.role}</h2>
    {(open || []).length === 0 && <p>No open shifts right now. Check back soon.</p>}
    {(open || []).map((s) => (
      <form key={s.id} action={claimShift} style={{ padding: 8, borderBottom: "1px solid #ddd" }}>
        <input type="hidden" name="id" value={s.id} />
        <b>{s.facility_type}</b>, {fmt(s.starts_at)} to {fmt(s.ends_at)}
        <br />
        <Pay base={s.base_rate} bonus={s.bonus_pay} total={s.total_rate} totalPay={s.total_pay} start={s.starts_at} end={s.ends_at} />
        <br />
        {s.spots_left} of {s.headcount} spot{s.headcount === 1 ? "" : "s"} open.
        {s.notes ? <><br />{s.notes}</> : null}
        <div style={{ marginTop: 6 }}><button type="submit">Claim shift</button></div>
      </form>
    ))}
    <p><small>We confirm each claim before it counts, and we tell you the facility name once it is confirmed.</small></p>

    <h3 style={{ marginTop: 32 }}>Your shifts</h3>
    {(mine || []).length === 0 && <p>You have not claimed any shifts yet.</p>}
    {(mine || []).map((c) => (
      <form key={c.claim_id} action={withdrawClaim} style={{ padding: 8, borderBottom: "1px solid #ddd" }}>
        <input type="hidden" name="id" value={c.claim_id} />
        <b>{c.facility_name || c.facility_type}</b>, {fmt(c.starts_at)} to {fmt(c.ends_at)}
        <br />
        <Pay base={c.base_rate} bonus={c.bonus_pay} total={c.total_rate} totalPay={c.total_pay} start={c.starts_at} end={c.ends_at} />
        <br />
        {LABEL[c.claim_status] || c.claim_status}
        {c.shift_status === "cancelled" ? " (cancelled)" : ""}
        <div style={{ marginTop: 6 }}><button type="submit">Withdraw</button></div>
      </form>
    ))}
    <p><small>Confirmed shifts can be withdrawn here more than 24 hours before they start. Closer than that, contact us.</small></p>
  </>);
}
