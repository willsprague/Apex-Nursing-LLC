"use client";

import { useActionState } from "react";
import { sendLink, verifyCode } from "../login/actions";

export default function SignUpForm() {
  const [sent, send, sending] = useActionState(sendLink, null);
  const [checked, verify, checking] = useActionState(verifyCode, null);
  const state = checked || sent;
  if (sent?.sent) {
    return (
      <form action={verify} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <input type="hidden" name="email" value={sent.email} />
        <input type="hidden" name="next" value="/apply" />
        <h3>Check your email</h3>
        <p className="lead">We sent a code to {sent.email}. Enter it here to finish creating your account and start your application.</p>
        <label htmlFor="code">Code from the email</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required />
        <button className="btn cta-big" type="submit" disabled={checking}>{checking ? "Checking..." : "Continue"}</button>
        {state && <p role="status">{state.message}</p>}
        <p><small>You can also tap the link in the same email.</small></p>
      </form>
    );
  }
  return (
    <form action={send} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <input type="hidden" name="next" value="/apply" />
      <label htmlFor="email">Your email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <button className="btn cta-big" type="submit" disabled={sending}>
        {sending ? "Sending..." : "Create my account"}
      </button>
      {state && !state.ok && <p role="alert">{state.message}</p>}
      <p><small>We email you a one-time code. There is no password to remember, and it is free.</small></p>
    </form>
  );
}
