"use client";

import { useActionState } from "react";
import { sendLink } from "../login/actions";

export default function SignUpForm() {
  const [state, action, pending] = useActionState(sendLink, null);
  if (state?.ok) {
    return (
      <div role="status">
        <h3>Check your email</h3>
        <p className="lead">
          We sent a link to your email. Open it on this device to finish creating your account,
          and you will come straight back here to start your application.
        </p>
      </div>
    );
  }
  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <input type="hidden" name="next" value="/apply" />
      <label htmlFor="email">Your email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <button className="btn cta-big" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Create my account"}
      </button>
      {state && !state.ok && <p role="alert">{state.message}</p>}
      <p><small>We email you a one-time link. There is no password to remember, and it is free.</small></p>
    </form>
  );
}
