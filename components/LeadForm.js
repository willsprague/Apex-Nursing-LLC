"use client";

import { useActionState } from "react";
import { submitLead } from "../app/actions";

const initialState = { ok: null, message: "" };

export default function LeadForm() {
  const [state, formAction, pending] = useActionState(submitLead, initialState);

  return (
    <form id="lead" action={formAction}>
      {/* Spam trap: hidden from people, filled in by bots. */}
      <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label>
        Facility name
        <input name="facility" required maxLength={200} autoComplete="organization" />
      </label>
      <label>
        Your name and title
        <input
          name="contact"
          required
          maxLength={200}
          autoComplete="name"
          placeholder="Director of nursing, administrator, or manager"
        />
      </label>
      <label>
        Email
        <input name="email" type="email" required maxLength={254} autoComplete="email" />
      </label>
      <label>
        Facility type
        <select id="ftype" name="type" required defaultValue="">
          <option value="">Choose one</option>
          <option>Long-term care</option>
          <option>Hospital</option>
          <option>Home health or clinic</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        What do you need?
        <select name="need" required defaultValue="">
          <option value="">Choose one</option>
          <option>Nursing shifts</option>
          <option>Care and support staff</option>
          <option>Both</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send request"}
      </button>
      <p id="status" role="status" aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
