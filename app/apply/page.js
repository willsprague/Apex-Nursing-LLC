import { createSupabase } from "../../lib/supabase/server";
import { BRAND } from "../../lib/brand";
import ApplyForm from "./ApplyForm";
import SignUpForm from "./SignUpForm";

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
  if (user) {
    const { data } = await supabase
      .from("worker_applications")
      .select("status, created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    application = data;
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
          {application.status === "cleared" && <p><a className="btn" href="/worker">Create my worker account</a></p>}
          <p><small>Submitted {new Date(application.created_at).toLocaleDateString("en-US")}.</small></p>
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
