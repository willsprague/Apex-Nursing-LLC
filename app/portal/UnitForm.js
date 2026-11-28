"use client";

import { useActionState } from "react";
import { addUnit } from "./actions";

const TYPES = ["Memory care", "Long-term care", "Skilled nursing", "Assisted living", "Rehab", "Medical-surgical",
  "ICU", "Emergency", "Behavioral health", "Home health", "Other"];

export default function UnitForm() {
  const [state, action, pending] = useActionState(addUnit, null);
  return (
    <form action={action} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      <label htmlFor="uname">Unit name</label>
      <input id="uname" name="name" maxLength={80} placeholder="Lee Unit" required />
      <label htmlFor="ufloor">Floor</label>
      <input id="ufloor" name="floor" maxLength={30} placeholder="2nd floor" />
      <label htmlFor="utype">Type</label>
      <select id="utype" name="type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      <label htmlFor="upatients">Patients on the unit</label>
      <input id="upatients" name="patients" type="number" min="1" max="999" required />
      <button className="btn alt" type="submit" disabled={pending}>{pending ? "Saving..." : "Save unit"}</button>
      {state && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
