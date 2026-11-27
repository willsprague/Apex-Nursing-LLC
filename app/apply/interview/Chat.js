"use client";
import { useEffect, useRef, useState } from "react";
import { sendMessage, requestHumanInterview } from "./actions";

export default function Chat({ initial }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  async function send(e) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    const res = await sendMessage(text);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      if (res.done) setDone(true);
      return;
    }
    setMessages(res.messages);
    setText("");
    if (res.done) setDone(true);
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div role="log" aria-live="polite" aria-label="Interview conversation" style={{ display: "grid", gap: 12, margin: "20px 0" }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              justifySelf: m.role === "user" ? "end" : "start",
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: 14,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? "var(--btn)" : "var(--surface)",
              color: m.role === "user" ? "var(--on-btn)" : "var(--text)",
              border: m.role === "user" ? "0" : "1px solid var(--line)",
            }}
          >
            <small style={{ display: "block", opacity: 0.75 }}>{m.role === "user" ? "You" : "Apixora AI assistant"}</small>
            {m.content}
          </div>
        ))}
        {busy && <div style={{ opacity: 0.7 }}>The assistant is typing...</div>}
        <div ref={endRef} />
      </div>

      {done ? (
        <>
          <p className="lead">Thank you. The team will review your answers and follow up by email.</p>
          <p><a className="btn" href="/apply">View my application status</a></p>
        </>
      ) : (
        <>
          <form onSubmit={send} style={{ display: "grid", gap: 10, maxWidth: 680 }}>
            <label htmlFor="answer">Your answer</label>
            <textarea
              id="answer" value={text} onChange={(e) => setText(e.target.value)} rows={3}
              maxLength={1500} disabled={busy}
              style={{ font: "inherit", padding: 12, border: "1px solid var(--line)", borderRadius: 4, background: "var(--surface)", color: "var(--text)" }}
            />
            {error && <p role="alert" style={{ color: "#b3261e", margin: 0, fontWeight: 600 }}>{error}</p>}
            <div><button className="btn" type="submit" disabled={busy}>{busy ? "Sending..." : "Send"}</button></div>
          </form>
          <form action={requestHumanInterview} style={{ marginTop: 20 }}>
            <button className="btn outline" type="submit">I would rather talk to a person</button>
          </form>
        </>
      )}
    </div>
  );
}
