"use client";

import { useActionState, useState } from "react";
import { postShift } from "./actions";

// roles: [{ role, min_bill_rate }]. units: [{ id, name, floor, unit_type, patients }]. The facility never sees the Apixora fee or the worker rate.
export default function ShiftForm({ roles, units }) {
  const [state, action, pending] = useActionState(postShift, null);
  const [rate, setRate] = useState("");
  const [role, setRole] = useState(roles[0]?.role || "");
  const min = Number(roles.find((r) => r.role === role)?.min_bill_rate || 0);

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
      <label htmlFor="unit">Unit</label>
      <select id="unit" name="unit" required>
        {units.map((u) => <option key={u.id} value={u.id}>{u.name}{u.floor ? `, ${u.floor}` : ""} ({u.unit_type}, {u.patients} patients)</option>)}
      </select>
      {units.length === 0 && <p><small>Add a unit above first.</small></p>}
      <label htmlFor="ratio">Ratio: patients per nurse on this shift</label>
      <input id="ratio" name="ratio" type="number" min="1" max="99" required />
      <label htmlFor="aides">Aides (LNAs) on this shift (optional)</label>
      <input id="aides" name="aides" type="number" min="0" max="99" />
      <label htmlFor="people">People needed</label>
      <input id="people" name="people" type="number" min="1" max="20" defaultValue="1" required />
      <p><small>Each person is a separate shift and a separate agreement.</small></p>
      <label htmlFor="rate">Hourly rate you will pay ($){min > 0 ? ` (minimum $${min.toFixed(2)})` : ""}</label>
      <input id="rate" name="rate" type="number" step="0.01" min="10" max="300"
        value={rate} onChange={(e) => setRate(e.target.value)} required />
      <label htmlFor="notes">Notes (optional, 300 characters)</label>
      <textarea id="notes" name="notes" maxLength={300} rows={3} />
      <p><small>Do not include resident or patient names or health details.</small></p>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Posting..." : "Post shift"}</button>
      {state && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
