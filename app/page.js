import { BRAND } from "../lib/brand";
import SettingsTabs from "../components/SettingsTabs";
import LeadForm from "../components/LeadForm";

export default function Home() {
  return (
    <>
      <header>
        <div className="wrap">
          <a className="logo" href="#top" aria-label="Home">
            <img className="mark" src="/mark.webp" alt="" width="46" height="45" />
            <span>
              <b>{BRAND.name.toUpperCase()}</b>
              <small>{BRAND.descriptor}</small>
            </span>
          </a>
          <nav>
            <a href="#settings">Who we serve</a>
            <a href="#how">How it works</a>
            <a href="/login">Facility sign in</a>
            <a className="btn" href="#contact">
              Request staffing
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <div className="hero">
          <div className="wrap">
            <h1>Healthcare staffing that fits how your facility works.</h1>
            <p>
              We are starting with long-term care in {BRAND.region} and building for hospitals,
              home health, and clinics next. Software handles credential checks and scheduling,
              so more of every shift&rsquo;s pay goes to the people doing the work.
            </p>
            <a className="btn" href="#settings">
              Find your setting
            </a>
            <a className="btn alt" href="#how">
              See how it works
            </a>
          </div>
        </div>

        <section id="settings">
          <div className="wrap">
            <h2>Choose your setting</h2>
            <p className="lead">
              Every setting has its own roles, credentials, and rhythm. Pick yours to see how we
              would staff it.
            </p>
            <SettingsTabs />
          </div>
        </section>

        <section id="how" className="band">
          <div className="wrap">
            <h2>How it works</h2>
            <p className="lead">
              The same simple process in every setting, with software doing the scheduling work.
            </p>
            <ol className="steps">
              <li>
                <b>Post a shift</b>
                <span>Tell us the role, date, and hours you need covered.</span>
              </li>
              <li>
                <b>Verified workers respond</b>
                <span>Qualified staff with current credentials pick up the shift.</span>
              </li>
              <li>
                <b>Approve the timesheet</b>
                <span>Review hours online and confirm when the shift is done.</span>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <div className="wrap">
            <h2>More of every shift goes to the worker</h2>
            <p style={{ maxWidth: "40em", fontSize: 22 }}>
              We run lean, with software doing the scheduling, credential tracking, and
              timesheets. Less overhead to cover means workers keep more of the rate you pay, and
              steady, well-paid staff are the ones who come back.
            </p>
          </div>
        </section>

        <section id="contact" className="band">
          <div className="wrap">
            <h2>Request staffing or join the waitlist</h2>
            <p className="lead">Tell us about your facility and we will follow up by email.</p>
            <LeadForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <img
            className="lockup"
            src="/logo.webp"
            alt={`${BRAND.name} logo`}
            width="220"
            height="182"
          />
          <p>
            &copy; 2026 {BRAND.name}, a trade name of {BRAND.legalName}. Starting with long-term
            care in {BRAND.region}.
          </p>
        </div>
      </footer>
    </>
  );
}
