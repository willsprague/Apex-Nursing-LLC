"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitApplication } from "./actions";
import { APPLY_ROLES, ID_TYPES, EXPERIENCE, SETTINGS, AVAILABILITY, REFERENCE_RELATIONSHIPS } from "./options";

export default function ApplyForm() {
  const [state, action, pending] = useActionState(submitApplication, { ok: null, message: "" });

  const errorRef = useRef(null);
  useEffect(() => {
    // After a failed submit, bring the message into view.
    if (state.ok === false && errorRef.current) { errorRef.current.scrollIntoView({ block: "center" }); errorRef.current.focus(); }
  }, [state]);
  const v = state.values || {};
  const has = (key, val) => (v[key] || []).includes(val);

  return (
    <form action={action}>
      {state.ok === false && (
        <p role="alert" ref={errorRef} tabIndex={-1} style={{ fontWeight: 600, borderLeft: "4px solid #d93025", paddingLeft: 12 }}>{state.message}</p>
      )}
      <div style={{ position: "absolute", left: "-10000px" }} aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label>Full name <input name="name" defaultValue={v.name} required maxLength={100} autoComplete="name" /></label>
      <label>Mobile phone <input name="phone" type="tel" defaultValue={v.phone} required maxLength={30} autoComplete="tel" /></label>
      <label>Town or city where you live <input name="town" defaultValue={v.town} required maxLength={100} autoComplete="address-level2" /></label>
      <label>
        Credential type
        <select name="role" required defaultValue={v.role || ""}>
          <option value="">Choose one</option>
          {APPLY_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label>License or certification state <input name="licenseState" required maxLength={40} defaultValue={v.licenseState || "NH"} /></label>
      <label>License or certification number <input name="license" defaultValue={v.license} required maxLength={40} /></label>
      <label>
        Years of experience
        <select name="experience" required defaultValue={v.experience || ""}>
          <option value="">Choose one</option>
          {EXPERIENCE.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Has any license or certification you hold ever been suspended, restricted, or disciplined?</legend>
        <label style={{ display: "block" }}><input type="radio" name="disciplined" value="no" defaultChecked={v.disciplined === "no"} required /> No</label>
        <label style={{ display: "block" }}><input type="radio" name="disciplined" value="yes" defaultChecked={v.disciplined === "yes"} /> Yes (we will contact you for details)</label>
      </fieldset>
      <fieldset>
        <legend>Forms of ID you can show when you are hired. Choose all that apply.</legend>
        {ID_TYPES.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="idTypes" value={s} defaultChecked={has("idTypes", s)} /> {s}</label>
        ))}
        <p><small>Only tick what you have. We do not collect ID numbers or images on this page.</small></p>
      </fieldset>
      {[1, 2].map((n) => (
        <fieldset key={n}>
          <legend>Professional reference {n}: a current or former supervisor, manager or co-worker who has seen your clinical work. No family or friends.</legend>
          <label>Name <input name={`ref${n}Name`} defaultValue={v[`ref${n}Name`]} required maxLength={100} /></label>
          <label>
            Professional relationship
            <select name={`ref${n}Rel`} required defaultValue={v[`ref${n}Rel`] || ""}>
              <option value="">Choose one</option>
              {REFERENCE_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label>Phone or email <input name={`ref${n}Contact`} defaultValue={v[`ref${n}Contact`]} required maxLength={254} /></label>
        </fieldset>
      ))}
      <fieldset>
        <legend>Work history: your most recent job first. Add up to three. Month and year is fine, like "Mar 2022".</legend>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ marginBottom: 12 }}>
            <p style={{ margin: "8px 0 0" }}><b>Job {n}</b>{n > 1 ? " (optional)" : ""}</p>
            <label>Employer <input name={`job${n}Employer`} defaultValue={v[`job${n}Employer`]} required={n === 1} maxLength={100} /></label>
            <label>Job title <input name={`job${n}Title`} defaultValue={v[`job${n}Title`]} required={n === 1} maxLength={100} /></label>
            <label>Started <input name={`job${n}From`} defaultValue={v[`job${n}From`]} required={n === 1} maxLength={30} /></label>
            <label>Ended (or "Present") <input name={`job${n}To`} defaultValue={v[`job${n}To`]} required={n === 1} maxLength={30} /></label>
          </div>
        ))}
      </fieldset>
      <fieldset>
        <legend>Where do you want to work? Choose all that apply.</legend>
        {SETTINGS.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="settings" value={s} defaultChecked={has("settings", s)} /> {s}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>When are you available? Choose all that apply.</legend>
        {AVAILABILITY.map((s) => (
          <label key={s} style={{ display: "block" }}><input type="checkbox" name="availability" value={s} defaultChecked={has("availability", s)} /> {s}</label>
        ))}
      </fieldset>
      <label style={{ display: "block" }}>
        <input type="checkbox" name="consent" defaultChecked={v.consent} required /> I agree that Apixora may contact me about
        shifts and look up my license with the state. I understand a background check may be needed
        later, and I will be asked for my permission before one is run.
      </label>
      <label style={{ display: "block" }}>
        <input type="checkbox" name="referenceConsent" defaultChecked={v.referenceConsent} required /> I agree that Apixora may contact my
        references and the past employers listed above to confirm my work and my experience.
      </label>
      <p><small>Do not enter your Social Security number or upload ID here. The background check runs through a secure provider page, and we check your ID in person when you are hired.</small></p>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Sending" : "Submit application"}</button>
    </form>
  );
}
