"use client";

import { useActionState } from "react";
import { submitApplication } from "./actions";
import { APPLY_ROLES, ID_TYPES, EXPERIENCE, SETTINGS, AVAILABILITY } from "./options";

export default function ApplyForm() {
  const [state, action, pending] = useActionState(submitApplication, { ok: null, message: "" });

  if (state.ok) {
    return (
      <div role="status">
        <h3>Thank you for applying</h3>
        <p className="lead">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action}>
      <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label>Full name <input name="name" required maxLength={100} autoComplete="name" /></label>
      <label>Mobile phone <input name="phone" type="tel" required maxLength={30} autoComplete="tel" /></label>
      <label>Town or city where you live <input name="town" required maxLength={100} autoComplete="address-level2" /></label>
      <label>
        Credential type
        <select name="role" required defaultValue="">
          <option value="">Choose one</option>
          {APPLY_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label>License or certification state <input name="licenseState" required maxLength={40} defaultValue="NH" /></label>
      <label>License or certification number <input name="license" required maxLength={40} /></label>
      <label>
        Years of experience
        <select name="experience" required defaultValue="">
          <option value="">Choose one</option>
          {EXPERIENCE.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Has any license or certification you hold ever been suspended, restricted, or disciplined?</legend>
        <label style={{ display: "block" }}><input type="radio" name="disciplined" value="no" required /> No</label>
        <label style={{ display: "block" }}><input type="radio" name="disciplined" value="yes" /> Yes (we will contact you for details)</label>
      </fieldset>
      <fieldset>
        <legend>Forms of ID you can show when you are hired. Choose all that apply.</legend>
        {ID_TYPES.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="idTypes" value={s} /> {s}</label>
        ))}
        <p><small>Only tick what you have. We do not collect ID numbers or images on this page.</small></p>
      </fieldset>
      {[1, 2].map((n) => (
        <fieldset key={n}>
          <legend>Professional reference {n}: a current or former supervisor, manager or co-worker who has seen your clinical work. No family or friends.</legend>
          <label>Name <input name={`ref${n}Name`} required maxLength={100} /></label>
          <label>How you know them <input name={`ref${n}Rel`} required maxLength={100} placeholder="Former charge nurse at ..." /></label>
          <label>Phone or email <input name={`ref${n}Contact`} required maxLength={254} /></label>
        </fieldset>
      ))}
      <fieldset>
        <legend>Where do you want to work? Choose all that apply.</legend>
        {SETTINGS.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="settings" value={s} /> {s}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>When are you available? Choose all that apply.</legend>
        {AVAILABILITY.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="availability" value={s} /> {s}</label>
        ))}
      </fieldset>
      <label style={{ display: "block" }}>
        <input type="checkbox" name="consent" required /> I agree that Apixora may contact me about
        shifts and look up my license with the state. I understand a background check may be needed
        later, and I will be asked for my permission before one is run.
      </label>
      <p><small>Do not enter your Social Security number or upload ID here. The background check runs through a secure provider page, and we check your ID in person when you are hired.</small></p>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Sending" : "Submit application"}</button>
      {state.ok === false && <p role="alert">{state.message}</p>}
    </form>
  );
}
