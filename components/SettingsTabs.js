"use client";

import { useRef, useState } from "react";

const SETTINGS = [
  {
    id: "ltc",
    label: "Long-term care",
    tag: "Available now in New Hampshire",
    title: "Long-term care",
    audience:
      "For administrators and directors of nursing at nursing homes and assisted living communities.",
    listHeading: "What you can fill",
    list: [
      "Call-outs and last-minute gaps",
      "Recurring schedules for steady coverage",
      "Longer placements that keep care teams consistent",
    ],
    roles:
      "Registered nurses, licensed practical nurses, nursing assistants, dietary, housekeeping, and activities staff.",
    cta: "Request staffing",
    formType: "Long-term care",
  },
  {
    id: "hosp",
    label: "Hospitals",
    tag: "Coming soon",
    title: "Hospitals",
    audience:
      "For nurse managers and staffing coordinators who need flexible coverage across units.",
    listHeading: "What we are building",
    list: [
      "Per diem and float coverage",
      "Credentials matched to each unit's requirements",
      "Credential records kept ready for review",
    ],
    roles: "Registered nurses and clinical support staff, organized by unit and specialty.",
    cta: "Join the waitlist",
    formType: "Hospital",
  },
  {
    id: "home",
    label: "Home health and clinics",
    tag: "Coming soon",
    title: "Home health and clinics",
    audience:
      "For agency directors and practice managers who need coverage that moves between visits and sites.",
    listHeading: "What we are building",
    list: [
      "Flexible visit and shift coverage",
      "Mileage tracking for field staff",
      "License and certification reminders",
    ],
    roles: "Nurses, aides, and medical assistants.",
    cta: "Join the waitlist",
    formType: "Home health or clinic",
  },
];

export default function SettingsTabs() {
  const [active, setActive] = useState(SETTINGS[0].id);
  const tabRefs = useRef({});

  function onKeyDown(e, index) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = SETTINGS[(index + step + SETTINGS.length) % SETTINGS.length];
    setActive(next.id);
    tabRefs.current[next.id]?.focus();
  }

  function chooseType(type) {
    const select = document.getElementById("ftype");
    if (select) select.value = type;
  }

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Facility type">
        {SETTINGS.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => (tabRefs.current[s.id] = el)}
            role="tab"
            id={`t-${s.id}`}
            aria-controls={`p-${s.id}`}
            aria-selected={active === s.id}
            tabIndex={active === s.id ? 0 : -1}
            onClick={() => setActive(s.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {SETTINGS.map((s) => (
        <div
          key={s.id}
          className="panel"
          role="tabpanel"
          id={`p-${s.id}`}
          aria-labelledby={`t-${s.id}`}
          hidden={active !== s.id}
        >
          <span className="tag">{s.tag}</span>
          <h3>{s.title}</h3>
          <p className="for">{s.audience}</p>
          <div className="two">
            <div>
              <h4>{s.listHeading}</h4>
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Roles</h4>
              <p className="roles">{s.roles}</p>
            </div>
          </div>
          <a className="btn" href="#contact" onClick={() => chooseType(s.formType)}>
            {s.cta}
          </a>
        </div>
      ))}
    </>
  );
}
