import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";
import { setStatus, signOut } from "./actions";

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

  return (
    <main><section><div className="wrap">
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
