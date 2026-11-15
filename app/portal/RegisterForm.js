"use client";

import { useActionState } from "react";
import { registerFacility } from "./actions";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerFacility, null);
  return (
    <form action={action} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      <label htmlFor="name">Facility name</label>
      <input id="name" name="name" required maxLength={200} />
      <label htmlFor="type">Facility type</label>
      <select id="type" name="type" required defaultValue="Long-term care">
        <option>Long-term care</option>
        <option>Hospital</option>
        <option>Home health or clinic</option>
        <option>Other</option>
      </select>
      <label htmlFor="contact">Your name and title</label>
      <input id="contact" name="contact" required maxLength={200} />
      <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : "Register facility"}</button>
      {state && !state.ok && <p role="alert">{state.message}</p>}
    </form>
  );
}
