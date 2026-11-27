import { redirect } from "next/navigation";
import { createSupabase } from "../../../lib/supabase/server";
import { BRAND } from "../../../lib/brand";
import { interviewEnabled, serviceClient } from "../../../lib/interview";
import { startInterview, requestHumanInterview } from "./actions";
import Chat from "./Chat";

export const dynamic = "force-dynamic";
export const metadata = {
  title: `Intake interview | ${BRAND.name}`,
  robots: { index: false, follow: false },
};

export default async function Interview() {
  const session = await createSupabase();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/apply");
  if (!interviewEnabled()) redirect("/apply");

  const db = serviceClient();
  const { data: app } = await db.from("worker_applications").select("id").eq("user_id", user.id).maybeSingle();
  if (!app) redirect("/apply");
  const { data: iv } = await db.from("application_interviews").select("status, messages").eq("user_id", user.id).maybeSingle();

  return (
    <main><section><div className="wrap">
      <p><a href="/apply">&larr; Back to my application</a></p>
      <h2>Short interview</h2>

      {!iv && (
        <>
          <p className="lead">
            This is a short text chat, about 10 minutes. Please read this first.
          </p>
          <ul style={{ maxWidth: 640, lineHeight: 1.7 }}>
            <li><b>You are talking to an AI assistant</b>, not a person.</li>
            <li>It asks about your shift preferences, experience, license and whether you can do the job&rsquo;s duties. It will not ask about your health, family, age, background or immigration status.</li>
            <li>The AI does not approve or reject anyone. <b>People on our team read your answers</b> and make every decision.</li>
            <li>We save the conversation and a summary so staff can review it. Please do not share Social Security numbers or ID numbers.</li>
            <li>You can ask for a <b>person to interview you instead</b> at any time, and doing that does not count against you.</li>
            <li>If you need an accommodation to take part, reply to any email from us and we will arrange one.</li>
          </ul>
          <form action={startInterview} style={{ display: "inline-block", marginRight: 12 }}>
            <button className="btn" type="submit">I understand, start the chat</button>
          </form>
          <form action={requestHumanInterview} style={{ display: "inline-block" }}>
            <button className="btn outline" type="submit">I would rather talk to a person</button>
          </form>
        </>
      )}

      {iv && iv.status === "in_progress" && <Chat initial={iv.messages} />}

      {iv && iv.status === "completed" && (
        <>
          <p className="lead">You finished the interview. Thank you. The team will review your answers and follow up by email.</p>
          <p><a className="btn" href="/apply">View my application status</a></p>
        </>
      )}

      {iv && iv.status === "human_requested" && (
        <>
          <p className="lead">Thank you. A member of our team will reach out to arrange a conversation with a person.</p>
          <p><a className="btn" href="/apply">View my application status</a></p>
        </>
      )}
    </div></section></main>
  );
}
