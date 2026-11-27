"use server";

import { redirect } from "next/navigation";
import { createSupabase } from "../../../lib/supabase/server";
import {
  interviewEnabled, serviceClient, systemPrompt, callClaude, parseSummary,
  OPENING, DONE_TOKEN, HUMAN_TOKEN, MAX_USER_MESSAGES, MAX_MESSAGE_CHARS, SUMMARY_SYSTEM,
} from "../../../lib/interview";

// Find the signed-in applicant and their application, or return null.
async function applicant() {
  const session = await createSupabase();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const db = serviceClient();
  const { data: app } = await db
    .from("worker_applications")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  return app ? { db, user, app } : null;
}

// The applicant has read the notice and chose to start.
export async function startInterview() {
  if (!interviewEnabled()) redirect("/apply");
  const a = await applicant();
  if (!a) redirect("/apply");
  const { error } = await a.db.from("application_interviews").insert({
    application_id: a.app.id,
    user_id: a.user.id,
    messages: [{ role: "assistant", content: OPENING }],
    model: process.env.INTERVIEW_MODEL || "claude-sonnet-5-5",
  });
  if (error && error.code !== "23505") console.error("start interview failed:", error.code);
  redirect("/apply/interview");
}

// The applicant prefers a person. Saved so staff see it, and no AI questions are asked.
export async function requestHumanInterview() {
  const a = await applicant();
  if (!a) redirect("/apply");
  const row = {
    status: "human_requested",
    flags: [{ type: "requested_human", detail: "Applicant asked for a person to interview them." }],
  };
  const { data: existing } = await a.db.from("application_interviews").select("id, status").eq("user_id", a.user.id).maybeSingle();
  if (!existing) {
    await a.db.from("application_interviews").insert({ application_id: a.app.id, user_id: a.user.id, ...row });
  } else if (existing.status !== "completed") {
    await a.db.from("application_interviews").update(row).eq("id", existing.id);
  }
  redirect("/apply/interview");
}

// One chat turn. Returns the updated transcript.
export async function sendMessage(input) {
  if (!interviewEnabled()) return { ok: false, message: "The interview is not available right now." };
  const text = typeof input === "string" ? input.trim() : "";
  if (!text) return { ok: false, message: "Type your answer first." };
  if (text.length > MAX_MESSAGE_CHARS) return { ok: false, message: "Please keep each answer under 1,500 characters." };

  const a = await applicant();
  if (!a) return { ok: false, message: "Your sign-in expired. Sign in again to continue." };
  const { data: row } = await a.db.from("application_interviews").select("*").eq("user_id", a.user.id).maybeSingle();
  if (!row || row.status !== "in_progress") return { ok: false, message: "This interview is already finished.", done: true };

  const history = Array.isArray(row.messages) ? row.messages : [];
  const userCount = history.filter((m) => m.role === "user").length;
  if (userCount >= MAX_USER_MESSAGES) return { ok: false, message: "This interview reached its length limit. Staff will review it.", done: true };

  const next = [...history, { role: "user", content: text }];
  // The API needs the conversation to start with a user turn.
  const apiMessages = [{ role: "user", content: "I have read the notice and I am ready to begin." }, ...next];

  let reply;
  try {
    reply = await callClaude({ system: systemPrompt(a.app), messages: apiMessages, maxTokens: 300 });
  } catch (e) {
    console.error("interview model call failed:", e.message);
    return { ok: false, message: "The interview is not working right now. Your application is still complete and staff will review it. You can try again later." };
  }

  const wantsHuman = reply.includes(HUMAN_TOKEN);
  const finished = reply.includes(DONE_TOKEN) || userCount + 1 >= MAX_USER_MESSAGES;
  const clean = reply.replaceAll(HUMAN_TOKEN, "").replaceAll(DONE_TOKEN, "").trim();
  const messages = [...next, { role: "assistant", content: clean || "Thank you." }];

  const update = { messages };
  if (wantsHuman) {
    update.status = "human_requested";
    update.flags = [{ type: "requested_human", detail: "Applicant asked for a person to interview them." }];
  } else if (finished) {
    try {
      const raw = await callClaude({
        system: SUMMARY_SYSTEM,
        messages: [{ role: "user", content: messages.map((m) => `${m.role === "user" ? "Applicant" : "Assistant"}: ${m.content}`).join("\n\n") }],
        maxTokens: 700,
      });
      const { summary, flags } = parseSummary(raw);
      update.summary = summary;
      update.flags = flags;
    } catch (e) {
      console.error("interview summary failed:", e.message);
      update.summary = "The summary could not be generated. Read the transcript.";
      update.flags = [{ type: "unclear_answer", detail: "Automatic summary failed." }];
    }
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  }
  const { error } = await a.db.from("application_interviews").update(update).eq("id", row.id);
  if (error) {
    console.error("interview save failed:", error.code);
    return { ok: false, message: "Your answer was not saved. Please send it again." };
  }
  return { ok: true, messages, done: update.status === "completed" || update.status === "human_requested", human: wantsHuman };
}
