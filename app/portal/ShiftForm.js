"use client";

import { useActionState, useState } from "react";
import { postShift } from "./actions";

// roles: [{ role, min_bill_rate }]; fee: percent taken from the rate the facility offers.
export default function ShiftForm({ roles, fee }) {
  const [state, action, pending] = useActionState(postShift, null);
  const [rate, setRate] = useState("");
  const [role, setRole] = useState(roles[0]?.role || "");
  const min = Number(roles.find((r) => r.role === role)?.min_bill_rate || 0);
  const r = Number(rate);
  const worker = r > 0 ? (r * (1 - fee / 100)).toFixed(2) : null;

  return (
    <form action={action} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      <label htmlFor="role">Role</label>
      <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)} required>
        {roles.map((x) => <option key={x.role}>{x.role}</option>)}
      </select>
      <label htmlFor="date">Date</label>
      <input id="date" name="date" type="date" required />
      <label htmlFor="start">Start time (Eastern)</label>
      <input id="start" name="start" type="time" required />
      <label htmlFor="end">End time (Eastern; a time before the start means the next day)</label>
      <input id="end" name="end" type="time" required />
      <label htmlFor="headcount">People needed</label>
      <input id="headcount" name="headcount" type="number" min="1" max="20" defaultValue="1" required />
      <label htmlFor="rate">Hourly rate you will pay ($){min > 0 ? ` (minimum $${min.toFixed(2)})` : ""}</label>
      <input id="rate" name="rate" type="number" step="0.01" min="10" max="300"
        value={rate} onChange={(e) => setRate(e.target.value)} required />
      {worker && (
        <p role="status">
          You pay ${r.toFixed(2)}/hr. The worker earns ${worker}/hr after the {fee}% Apixora fee.
        </p>
      )}
      <label htmlFor="notes">Notes (optional, 300 characters)</label>
      <textarea id="notes" name="notes" maxLength={300} rows={3} />
      <p><small>Do not include resident or patient names or health details.</small></p>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Posting..." : "Post shift"}</button>
      {state && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
