"use client";

import { useActionState } from "react";
import { sendLink } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(sendLink, null);
  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Email me a sign-in link"}
      </button>
      {state && <p role="status">{state.message}</p>}
    </form>
  );
}
