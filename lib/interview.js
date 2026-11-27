import { createClient } from "@supabase/supabase-js";

// The AI interview stays off until AI_INTERVIEW_ENABLED is "true" and an Anthropic key is set.
export function interviewEnabled() {
  return (
    process.env.AI_INTERVIEW_ENABLED === "true" &&
    !!process.env.ANTHROPIC_API_KEY &&
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function serviceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export const MAX_USER_MESSAGES = 24;
export const MAX_MESSAGE_CHARS = 1500;
export const DONE_TOKEN = "[[INTERVIEW_COMPLETE]]";
export const HUMAN_TOKEN = "[[HUMAN_REQUESTED]]";

export const OPENING =
  "Hello, I am Apixora's AI intake assistant. I will ask you a few questions about your work experience and availability. " +
  "Staff read your answers, and a person makes every decision about your application. I do not approve or reject anyone. " +
  "You can ask for a person to interview you instead at any time.\n\n" +
  "First, which shifts do you prefer (days, evenings, nights, weekends), and how soon could you start?";

// Staff-facing flag types. A flag is something for a person to look at, never a decision.
export const FLAG_LABELS = {
  no_active_license: "Says they do not hold an active license or certification",
  not_authorized_to_work: "Says they are not authorized to work in the U.S.",
  cannot_perform_duties: "Says they cannot do the essential duties, even with reasonable accommodation",
  unwilling_onboarding: "Says they are unwilling to complete reference checks, background check or physical and TB test",
  limited_availability: "Very limited availability",
  unclear_answer: "Answer to a key question was unclear",
  requested_human: "Asked for a person to interview them",
};

export function systemPrompt(app) {
  const licensed = /\((RN|LPN|LNA)\)/.test(app.role || "");
  return `You are the Apixora intake assistant, an AI that runs a short, friendly first-round chat for a ${app.role} applicant in New Hampshire long-term care. The applicant has already seen the notice that an AI is asking and that people make every decision.

Ask ONE question at a time, in plain, warm, short language. Do not repeat the question you were already asked. Cover these topics in this order, adapting to what they say:
1. Shift preference and start date (already asked in your opening message).
2. Recent work experience in long-term care or similar settings.
${licensed ? `3. Whether they currently hold an active license or certification for this role in the state they listed. Say staff will verify it with the state; do not ask for the license number.` : `3. Skip the license question for this role.`}
4. Whether they are legally authorized to work in the United States. Ask only that. Do not ask about citizenship, visa type, national origin or ask for documents.
5. Whether they can perform the essential duties of the role (for example standing for a full shift, lifting and repositioning residents with proper technique) with or without reasonable accommodation. Do not ask about health conditions, disabilities or medications.
6. Whether they are willing to complete reference checks, a background check with their written permission, and later a physical and TB test as part of onboarding. Do not ask about criminal history; the formal background check covers it.
7. Two short, job-related scenario questions suited to the role, such as how they would respond if a resident refuses care, or what they would do if they noticed a sudden change in a resident. Judge the content of what they say, never their grammar, accent or writing style.
8. Which towns or how far they are willing to travel, and anything else they want us to know.

Hard rules:
- Never ask about or comment on age, race, color, religion, sex, pregnancy, family or marital status, sexual orientation, gender identity, national origin, disability, health, genetic information, military status, arrests, credit, salary history, Social Security number or ID numbers. If the applicant volunteers any of that, do not follow up on it or react to it. Say they do not need to share that and move to the next topic.
- Never say or hint whether they will be hired, are a good fit, or how they are doing. Do not score or rate them. If asked, say a person on the team reviews every application.
- Stay on topic. If asked something else, say you can only help with this interview and staff can answer other questions.
- If the applicant asks for a person or a human interview, reply with one kind sentence saying a team member will reach out, then add the exact token ${HUMAN_TOKEN} on its own line.
- When all topics are covered (usually 10 to 12 questions), thank them, say the team will review and follow up by email, and add the exact token ${DONE_TOKEN} on its own line.
- Keep every message under 80 words.`;
}

export const SUMMARY_SYSTEM = `You write a factual note for hiring staff from an intake chat transcript. A person makes every decision.

Return ONLY a JSON object with these keys:
- "summary": at most 140 words in plain language, restating only what the applicant said (shift preferences, start date, experience, how they answered the scenarios). Do not judge personality, tone, grammar, accent, enthusiasm or "fit". Do not recommend hiring or rejecting. Never include protected or health information the applicant volunteered.
- "flags": an array of {"type": string, "detail": string}. Add a flag ONLY when the applicant's own words clearly say it. Allowed types: ${Object.keys(FLAG_LABELS).filter((k) => k !== "requested_human").join(", ")}. "detail" quotes or closely paraphrases their words. A flag is something for staff to look at, not a conclusion. If nothing applies, return an empty array.`;

export async function callClaude({ system, messages, maxTokens = 400 }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.INTERVIEW_MODEL || "claude-sonnet-5-5",
      max_tokens: maxTokens,
      system,
      messages,
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

export function parseSummary(raw) {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const obj = JSON.parse(raw.slice(start, end + 1));
    const flags = (Array.isArray(obj.flags) ? obj.flags : [])
      .filter((f) => f && FLAG_LABELS[f.type] && f.type !== "requested_human")
      .map((f) => ({ type: f.type, detail: String(f.detail || "").slice(0, 400) }));
    return { summary: String(obj.summary || "").slice(0, 1500), flags };
  } catch {
    return { summary: "The summary could not be generated. Read the transcript.", flags: [{ type: "unclear_answer", detail: "Automatic summary failed." }] };
  }
}
