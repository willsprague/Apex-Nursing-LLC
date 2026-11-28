"use client";

import { useActionState } from "react";
import { staffSignIn } from "./actions";

export default function StaffForm() {
  const [state, action, pending] = useActionState(staffSignIn, null);
  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <label htmlFor="email">Staff email</label>
      <input id="email" name="email" type="email" required autoComplete="username" />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required autoComplete="current-password" />
      <button className="btn" type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
      {state && <p role="alert">{state.message}</p>}
    </form>
  );
}
