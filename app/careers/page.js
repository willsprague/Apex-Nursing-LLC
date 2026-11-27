import { BRAND } from "../../lib/brand";
import SiteHeader from "../../components/SiteHeader";

export const metadata = {
  title: `Careers at ${BRAND.name}`,
  description: `Nursing and care jobs in ${BRAND.region}. Choose your shifts, see your rate up front, and apply for free.`,
};

const ROLES = [
  "Registered nurses (RN)",
  "Licensed practical nurses (LPN)",
  "Licensed nursing assistants (LNA)",
  "Dietary aides",
  "Housekeeping",
  "Activities aides",
];

export default function Careers() {
  return (
    <>
      <SiteHeader brand={BRAND.name} descriptor={BRAND.descriptor} />

      <main>
        <div className="hero">
          <div className="wrap">
            <h1>Work the shifts you want, and keep more of what you earn.</h1>
            <p>
              {BRAND.name} connects nurses and care staff with {BRAND.region} long-term care
              facilities. You see the hourly rate before you claim a shift, and software handles
              the scheduling, so more of each shift&rsquo;s pay goes to you.
            </p>
            <a className="btn cta-big" href="/apply">Apply today</a>
            <a className="btn alt" href="#how">How applying works</a>
          </div>
        </div>

        <section>
          <div className="wrap">
            <h2>Why work with {BRAND.name}</h2>
            <div className="cards">
              <div><h3>You choose your shifts</h3><p>Browse open shifts for your role and claim the ones that fit your life.</p></div>
              <div><h3>Your rate is clear</h3><p>See what you will earn per hour, and any bonus on hard-to-fill shifts, before you claim.</p></div>
              <div><h3>Apply once</h3><p>One application, one set of checks, then you can pick up shifts at facilities across the area.</p></div>
              <div><h3>Applying is free</h3><p>There is no fee to apply or to join.</p></div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <h2>Who we are hiring</h2>
            <ul>
              {ROLES.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p><a className="btn" href="/apply">Apply today</a></p>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <h2>How applying works</h2>
            <ol className="steps">
              <li><b>Create your free account</b><span>Enter your email and we send a one-time link. No password.</span></li>
              <li><b>Fill out your application</b><span>Tell us about your credential, license, experience and two professional references. It takes about ten minutes.</span></li>
              <li><b>We check your background</b><span>We verify your license, call your references, and run a background check with your written permission.</span></li>
              <li><b>Health screening</b><span>Once you are approved, we send you to an urgent care partner for a physical and a TB test. We do not ask for these before you are approved.</span></li>
              <li><b>Start picking up shifts</b><span>Create your worker account and claim open shifts for your role.</span></li>
            </ol>
            <p style={{ marginTop: 32 }}><a className="btn cta-big" href="/apply">Apply today</a></p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>
            &copy; 2026 {BRAND.name}, a trade name of {BRAND.legalName}. Starting with long-term
            care in {BRAND.region}.
          </p>
        </div>
      </footer>
      <div className="dockpad" aria-hidden="true" />
      <div className="dock">
        <a className="btn pill ghost" href="/">Home</a>
        <a className="btn pill" href="/apply">Apply today</a>
      </div>
    </>
  );
}
