import { redirect } from "next/navigation";
import { createSupabase } from "../../lib/supabase/server";
import { setStatus, signOut, setListingStatus, setVerified } from "./actions";

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

  const { data: people } = await supabase
    .from("profiles")
    .select("id, role, display_name, verified, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: listings } = await supabase
    .from("care_listings")
    .select("id, created_at, town, care_type, schedule, hourly_rate, details, status, poster:profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main><section><div className="wrap">
      <h2>App accounts</h2>
      <p className="lead">Check a person's ID or nursing license first, then mark them verified.</p>
      {(people || []).length === 0 && <p>No accounts yet.</p>}
      {(people || []).map((p) => (
        <form key={p.id} action={setVerified} style={{ display: "flex", gap: 12, padding: 6 }}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="value" value={p.verified ? "false" : "true"} />
          <span>{p.display_name} ({p.role}) {p.verified ? "- verified" : "- not verified"}</span>
          <button type="submit">{p.verified ? "Remove verification" : "Mark verified"}</button>
        </form>
      ))}

      <h2>Care listings</h2>
      <p className="lead">Approve only listings with no names, addresses or health details.</p>
      {(listings || []).length === 0 && <p>No listings yet.</p>}
      {(listings || []).map((l) => (
        <form key={l.id} action={setListingStatus} style={{ padding: 8, borderBottom: "1px solid #ddd" }}>
          <input type="hidden" name="id" value={l.id} />
          <b>{l.town}</b>, {l.care_type}, ${l.hourly_rate}/hr, {l.schedule}
          <br />
          {l.details}
          <br />
          <small>Posted by {l.poster?.display_name || "unknown"} - {l.status}</small>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button name="status" value="approved" type="submit">Approve</button>
            <button name="status" value="rejected" type="submit">Reject</button>
            <button name="status" value="closed" type="submit">Close</button>
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
