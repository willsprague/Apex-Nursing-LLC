"use client";
import { useState } from "react";

const FAC = [
  ["Request staffing", "Create an account and register your facility."],
  ["We verify you", "We confirm your facility before you can post."],
  ["Post a shift", "Role, date, hours, headcount and the rate you pay. Add a bonus if it is urgent."],
  ["Approve and done", "We confirm a worker, and you review hours after the shift."],
];
const NUR = [
  ["Create an account", "Free, with an emailed sign-in link. No password."],
  ["Apply", "Credential, license, two professional references and your availability."],
  ["Get approved", "We check your license and references, then run a background check."],
  ["Claim shifts", "Finish the physical and TB test, then pick up shifts at the pay shown."],
];

export default function HowTabs() {
  const [side, setSide] = useState("fac");
  const steps = side === "fac" ? FAC : NUR;
  return (
    <>
      <div className="seg" role="tablist" aria-label="Choose your side">
        {[["fac", "Facilities"], ["nur", "Nurses and aides"]].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`how-${k}`}
            aria-selected={side === k}
            aria-controls="how-steps"
            onClick={() => setSide(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="hsteps" id="how-steps" role="tabpanel" aria-labelledby={`how-${side}`}>
        {steps.map(([t, d]) => (
          <li key={t}>
            <b>{t}</b>
            <span>{d}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
