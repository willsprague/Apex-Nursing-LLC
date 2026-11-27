import { createSupabase } from "../../lib/supabase/server";
import { BRAND } from "../../lib/brand";
import ApplyForm from "./ApplyForm";
import SignUpForm from "./SignUpForm";
import { interviewEnabled, serviceClient } from "../../lib/interview";

export const dynamic = "force-dynamic";
export const metadata = {
  title: `Apply today | ${BRAND.name}`,
  robots: { index: false, follow: false },
};

const STAGES = {
  new: ["Received", "We have your application and will start reviewing it."],
  contacted: ["In review", "We are reviewing your application and checking your license and references."],
  background_check: ["Background check", "Your background check is in progress."],
  approved: ["Approved", "You passed our review. Next is a physical and TB test at our urgent care partner. We will email you the details."],
  health_screening: ["Physical and TB test", "Complete your physical and TB test. When we have confirmation, you can start picking up shifts."],
  cleared: ["Cleared to work", "You are cleared. Create your worker account to see open shifts."],
  declined: ["Not moving forward", "We are not able to move forward with your application right now. Thank you for applying."],
};

// The steps an applicant moves through, and which one each status means they are on.
const TRACK = [
  ["Account created", "Your free account is set up."],
  ["Application submitted", "We have your application."],
  ["Review and background check", "We check your license and professional references, then run a background check with your written permission."],
  ["Approved", "You passed our review."],
  ["Physical and TB test", "An urgent care partner does your physical and TB test. We only ask for this after you are approved."],
  ["Cleared to work", "Create your worker account and start picking up shifts."],
];
const CURRENT = { new: 2, contacted: 2, background_check: 2, approved: 3, health_screening: 4, cleared: 5 };

function Tracker({ status }) {
  const current = CURRENT[status] ?? 2;
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: "24px 0", display: "grid", gap: 16, maxWidth: 560 }}>
      {TRACK.map(([title, detail], i) => {
        const done = i < current || (status === "cleared" && i === current);
        const here = i === current && status !== "cleared";
        return (
          <li key={title} style={{ display: "flex", gap: 14, opacity: !done && !here ? 0.55 : 1 }} aria-current={here ? "step" : undefined}>
            <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none", fontWeight: 700, border: "1.5px solid var(--gold)", background: done ? "var(--gold)" : "transparent", color: done ? "#10201A" : "inherit" }}>
              {done ? "\u2713" : here ? "\u2022" : ""}
            </span>
            <span>
              <b>{title}{here ? " (you are here)" : ""}{done ? " (done)" : ""}</b>
              <br />
              <span style={{ opacity: 0.85 }}>{detail}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Steps({ current }) {
  const items = [
    "Create your account",
    "Fill out your application",
    "Background check and review",
    "Physical and TB test (after approval)",
    "Start picking up shifts",
  ];
  return (
    <ol className="steps" style={{ margin: "24px 0 36px" }}>
      {items.map((t, i) => (
        <li key={t} style={{ opacity: i + 1 < current ? 0.55 : 1 }}>
          <b>{t}{i + 1 === current ? " (you are here)" : ""}</b>
        </li>
      ))}
    </ol>
  );
}

export default async function Apply() {
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let application = null;
  let interview = null; // null = interview is off, otherwise none, in_progress, completed or human_requested
  if (user) {
    const { data } = await supabase
      .from("worker_applications")
      .select("status, created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    application = data;
    if (application && interviewEnabled()) {
      const { data: iv } = await serviceClient()
        .from("application_interviews")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      interview = iv ? iv.status : "none";
    }
  }

  return (
    <main><section><div className="wrap">
      <p><a href="/careers">&larr; Back to careers</a></p>
      <h2>Apply today</h2>
      {!user && (
        <>
          <p className="lead">
            Start in two minutes. First create your free account, then complete your application.
            Applying is free, and we do not ask for your Social Security number or ID on this site.
          </p>
          <Steps current={1} />
          <SignUpForm />
          <p style={{ marginTop: 24 }}><small>Already started? <a href="/login">Sign in</a> to continue.</small></p>
        </>
      )}
      {user && application && (
        <>
          <p className="lead">Signed in as {user.email}.</p>
          <h3>Your application: {(STAGES[application.status] || STAGES.new)[0]}</h3>
          <p>{(STAGES[application.status] || STAGES.new)[1]}</p>
          {application.status !== "declined" && <Tracker status={application.status} />}
          {application.status !== "declined" && (interview === "none" || interview === "in_progress") && (
            <div style={{ border: "1px solid var(--gold)", borderRadius: 8, padding: 16, maxWidth: 560, margin: "0 0 24px" }}>
              <b>{interview === "in_progress" ? "Finish your short interview" : "Next step: a short interview"}</b>
              <p style={{ margin: "6px 0 12px" }}>
                A 10 minute text chat with our AI assistant helps us review your application faster.
                People on our team make every decision, and you can ask for a person instead.
              </p>
              <a className="btn" href="/apply/interview">{interview === "in_progress" ? "Continue the interview" : "Start the interview"}</a>
            </div>
          )}
          {interview === "completed" && <p>Interview: <b>done</b>. The team will review it.</p>}
          {interview === "human_requested" && <p>Interview: a team member will reach out to arrange a conversation.</p>}
          {application.status === "cleared" && <p><a className="btn" href="/worker">Create my worker account</a></p>}
          <p><small>Submitted {new Date(application.created_at).toLocaleDateString("en-US")}. Questions? Reply to any email we send you.</small></p>
        </>
      )}
      {user && !application && (
        <>
          <p className="lead">
            You are signed in as {user.email}. Complete your application below. We review every
            application, check your license and professional references, and run a background
            check with your written permission. We ask for the physical and TB test only after you
            are approved.
          </p>
          <Steps current={2} />
          <ApplyForm />
        </>
      )}
    </div></section></main>
  );
}
