"use client";

import { useActionState } from "react";
import { sendLink, verifyCode } from "./actions";

export default function LoginForm({ next }) {
  const [sent, send, sending] = useActionState(sendLink, null);
  const [checked, verify, checking] = useActionState(verifyCode, null);
  const state = checked || sent;
  const waiting = sent?.sent;

  if (waiting) {
    return (
      <form action={verify} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input type="hidden" name="email" value={sent.email} />
        <input type="hidden" name="next" value={sent.next} />
        <p>We emailed a code to <b>{sent.email}</b>.</p>
        <label htmlFor="code">Code from the email</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required />
        <button className="btn" type="submit" disabled={checking}>{checking ? "Checking..." : "Sign in"}</button>
        {state && <p role="status">{state.message}</p>}
        <p><small>Or tap the link in the same email. Wrong address? Reload this page.</small></p>
      </form>
    );
  }
  return (
    <form action={send} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" />
      <button className="btn" type="submit" disabled={sending}>{sending ? "Sending..." : "Email me a code"}</button>
      {state && <p role="status">{state.message}</p>}
    </form>
  );
}
