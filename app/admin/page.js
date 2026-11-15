import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";
import { setStatus, signOut, setFee, setRoleMin, setFacilityVerified, setShiftStatus } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const STATUSES = ["new", "contacted", "qualified", "closed"];

export default async function Admin() {
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main><section><div className="wrap">
        <h2>No access</h2>
        <p className="lead">This account is not on the staff list.</p>
        <form action={signOut}><button className="btn" type="submit">Sign out</button></form>
      </div></section></main>
    );
  }

  const { data: leads, error } = await supabase
    .from("facility_leads")
    .select("id, created_at, facility, contact, email, facility_type, need, status")
    .order("created_at", { ascending: false })
    .limit(200);

  const [{ data: feeRow }, { data: roles }, { data: facilities }, { data: shifts }] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "fee_percent").maybeSingle(),
    supabase.from("shift_roles").select("role, min_bill_rate").order("role"),
    supabase.from("facilities").select("id, name, facility_type, contact_name, verified").order("created_at", { ascending: false }).limit(200),
    supabase.from("shifts")
      .select("id, role, starts_at, ends_at, headcount, bill_rate, fee_percent, worker_rate, status, notes, facility:facilities(name)")
      .order("starts_at", { ascending: false }).limit(200),
  ]);
  const when = (iso) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <main><section><div className="wrap">
      <h2>Pricing</h2>
      <p className="lead">The fee is a percent of the rate the facility pays. Changes apply only to shifts posted afterward.</p>
      <form action={setFee} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label htmlFor="fee">Apixora fee (%)</label>
        <input id="fee" name="value" type="number" step="0.5" min="0" max="60" defaultValue={feeRow?.value ?? 25} />
        <button type="submit">Save fee</button>
      </form>
      <p style={{ marginTop: 16 }}>Lowest hourly rate a facility may offer, by role:</p>
      {(roles || []).map((r) => (
        <form key={r.role} action={setRoleMin} style={{ display: "flex", gap: 8, padding: 4 }}>
          <input type="hidden" name="role" value={r.role} />
          <span style={{ minWidth: 240 }}>{r.role}</span>
          <input name="value" type="number" step="0.5" min="0" max="300" defaultValue={r.min_bill_rate} aria-label={`Minimum rate for ${r.role}`} />
          <button type="submit">Save</button>
        </form>
      ))}

      <h2>Facility accounts</h2>
      <p className="lead">Confirm each facility is real before you verify it.</p>
      {(facilities || []).length === 0 && <p>No facility accounts yet.</p>}
      {(facilities || []).map((f) => (
        <form key={f.id} action={setFacilityVerified} style={{ display: "flex", gap: 12, padding: 6 }}>
          <input type="hidden" name="id" value={f.id} />
          <input type="hidden" name="value" value={f.verified ? "false" : "true"} />
          <span>{f.name} ({f.facility_type}), contact {f.contact_name} - {f.verified ? "verified" : "not verified"}</span>
          <button type="submit">{f.verified ? "Remove verification" : "Mark verified"}</button>
        </form>
      ))}

      <h2>Shifts</h2>
      {(shifts || []).length === 0 && <p>No shifts yet.</p>}
      {(shifts || []).map((s) => (
        <form key={s.id} action={setShiftStatus} style={{ padding: 8, borderBottom: "1px solid #ddd" }}>
          <input type="hidden" name="id" value={s.id} />
          <b>{s.facility?.name}</b>: {s.role} x{s.headcount}, {when(s.starts_at)} to {when(s.ends_at)}
          <br />
          Facility pays ${s.bill_rate}/hr, worker earns ${s.worker_rate}/hr ({s.fee_percent}% fee). {s.notes}
          <br />
          <small>Status: {s.status}</small>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button name="status" value="filled" type="submit">Mark filled</button>
            <button name="status" value="open" type="submit">Reopen</button>
            <button name="status" value="cancelled" type="submit">Cancel</button>
          </div>
        </form>
      ))}

      <h2>Facility requests</h2>
      <form action={signOut}><button className="btn alt" type="submit">Sign out</button></form>
      {error && <p role="alert">Could not load requests.</p>}
      {leads && leads.length === 0 && <p>No requests yet.</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Received", "Facility", "Contact", "Email", "Type", "Need", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(leads || []).map((l) => (
              <tr key={l.id}>
                <td style={{ padding: 8 }}>{new Date(l.created_at).toLocaleDateString("en-US")}</td>
                <td style={{ padding: 8 }}>{l.facility}</td>
                <td style={{ padding: 8 }}>{l.contact}</td>
                <td style={{ padding: 8 }}><a href={`mailto:${l.email}`}>{l.email}</a></td>
                <td style={{ padding: 8 }}>{l.facility_type}</td>
                <td style={{ padding: 8 }}>{l.need}</td>
                <td style={{ padding: 8 }}>
                  <form action={setStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={l.id} />
                    <select name="status" defaultValue={l.status} aria-label="Status">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="submit">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div></section></main>
  );
}
