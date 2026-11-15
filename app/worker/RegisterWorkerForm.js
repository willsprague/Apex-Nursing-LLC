"use client";

import { useActionState } from "react";
import { registerWorker } from "./actions";

export default function RegisterWorkerForm({ roles }) {
  const [state, action, pending] = useActionState(registerWorker, null);
  return (
    <form action={action} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
      <label htmlFor="name">Your full name</label>
      <input id="name" name="name" required maxLength={100} autoComplete="name" />
      <label htmlFor="role">Your role</label>
      <select id="role" name="role" required>
        {roles.map((r) => <option key={r}>{r}</option>)}
      </select>
      <label htmlFor="license">License or certification number</label>
      <input id="license" name="license" required maxLength={40} />
      <p><small>We check this against the state license lookup before you can claim shifts.</small></p>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Saving..." : "Create worker account"}</button>
      {state && !state.ok && <p role="alert">{state.message}</p>}
    </form>
  );
}
