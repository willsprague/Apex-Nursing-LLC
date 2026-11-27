"use client";
import { useEffect, useRef, useState } from "react";

const MENUS = [
  {
    id: "fac",
    label: "For facilities",
    items: [
      ["Request staffing", "Tell us the role, date and hours.", "/#contact"],
      ["See how a shift looks", "What workers see before they claim.", "/#board"],
      ["How shifts get filled", "Post, match, approve.", "/#how"],
      ["Settings we serve", "Long-term care now, more next.", "/#settings"],
    ],
  },
  {
    id: "nur",
    label: "For nurses and aides",
    items: [
      ["Apply today", "Create an account, then apply.", "/apply"],
      ["See pay up front", "Rate and total pay before you claim.", "/#board"],
      ["How applying works", "Four steps to your first shift.", "/careers#how"],
      ["Check your application", "See where you are in the process.", "/apply"],
    ],
  },
];

export default function SiteHeader({ brand, descriptor }) {
  const [open, setOpen] = useState(null); // id of the open dropdown
  const [drawer, setDrawer] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(null);
        setDrawer(false);
      }
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const hoverOK = () => typeof window !== "undefined" && window.matchMedia("(hover:hover)").matches;

  return (
    <header ref={ref}>
      <div className="wrap">
        <a className="logo" href="/" aria-label="Home">
          <img className="mark" src="/mark.webp" alt="" width="46" height="45" />
          <span>
            <b>{brand.toUpperCase()}</b>
            <small>{descriptor}</small>
          </span>
        </a>

        <div className="mnav" role="navigation" aria-label="Main">
          {MENUS.map((m) => (
            <div
              key={m.id}
              className="mmenu"
              onMouseEnter={() => hoverOK() && setOpen(m.id)}
              onMouseLeave={() => hoverOK() && setOpen(null)}
            >
              <button
                type="button"
                aria-expanded={open === m.id}
                aria-controls={`menu-${m.id}`}
                onClick={() => setOpen(open === m.id ? null : m.id)}
              >
                {m.label}
              </button>
              <div className="mpanel" id={`menu-${m.id}`} hidden={open !== m.id}>
                {m.items.map(([t, d, href]) => (
                  <a key={t} href={href} onClick={() => setOpen(null)}>
                    <b>{t}</b>
                    <span>{d}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a className="mlink" href="/login">Sign in</a>
          <a className="btn pill ghost" href="/#contact">Request staffing</a>
          <a className="btn pill" href="/apply">Apply today</a>
        </div>

        <button
          type="button"
          className="burger"
          aria-expanded={drawer}
          aria-controls="drawer"
          onClick={() => setDrawer(!drawer)}
        >
          Menu
        </button>
      </div>

      <div className="drawer" id="drawer" hidden={!drawer}>
        <div className="wrap" onClick={(e) => e.target.tagName === "A" && setDrawer(false)}>
          {MENUS.map((m) => (
            <div key={m.id}>
              <div className="grp">{m.label}</div>
              {m.items.slice(0, 2).map(([t, , href]) => (
                <a key={t} href={href}>{t}</a>
              ))}
            </div>
          ))}
          <div className="grp">Account</div>
          <a href="/login">Sign in</a>
        </div>
      </div>
    </header>
  );
}
