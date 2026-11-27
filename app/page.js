import { BRAND } from "../lib/brand";
import SettingsTabs from "../components/SettingsTabs";
import LeadForm from "../components/LeadForm";
import SiteHeader from "../components/SiteHeader";
import HowTabs from "../components/HowTabs";

export default function Home() {
  return (
    <>
      <SiteHeader brand={BRAND.name} descriptor={BRAND.descriptor} />

      <main id="top">
        <div className="hero2">
          <div className="wrap">
            <p className="eyebrow">{BRAND.region} &middot; Long-term care first</p>
            <h1>Shifts filled by people you can verify.</h1>
            <p className="sub">
              Facilities post a shift. Credentialed nurses and aides see the pay and claim it.
              Software handles the paperwork, so more of each shift goes to the person working it.
            </p>
            <div className="paths">
              <a className="path fac" href="#contact">
                <span className="eyebrow">For facilities</span>
                <h2>I need to cover a shift</h2>
                <p>Post the role, date and hours. We confirm each worker before they show up.</p>
                <span className="go">Request staffing</span>
              </a>
              <a className="path nur" href="/apply">
                <span className="eyebrow">For nurses and aides</span>
                <h2>I want to work shifts</h2>
                <p>Create a free account and apply. See the rate and total pay before you claim anything.</p>
                <span className="go">Apply today</span>
              </a>
            </div>
            <div className="trust">
              <span>License and reference checks</span>
              <span>Pay shown before you claim</span>
              <span>Background check before approval</span>
            </div>
          </div>
        </div>

        <section id="board" className="band">
          <div className="wrap">
            <div className="head">
              <p className="eyebrow">What workers see</p>
              <h2>The shift, the pay and the total, up front</h2>
              <p>
                Nobody has to ask what a shift pays. When a facility adds a bonus, the old rate is
                crossed out so a raise is easy to spot.
              </p>
            </div>
            <div className="board">
              <article className="shift">
                <div className="top"><span className="chip">Long-term care</span><span className="chip">2 of 2 open</span></div>
                <div className="role">Licensed Nursing Assistant</div>
                <div className="when">Sat &middot; 7:00 AM to 3:00 PM</div>
                <div className="pay"><strong>$24.00/hr</strong></div>
                <div className="total">About $192 for 8 hours</div>
                <a className="claim" href="/apply">Apply to claim shifts</a>
              </article>
              <article className="shift">
                <div className="top"><span className="chip">Long-term care</span><span className="chip bonus">Bonus added</span></div>
                <div className="role">Licensed Practical Nurse</div>
                <div className="when">Sun &middot; 3:00 PM to 11:00 PM</div>
                <div className="pay"><s>$38.00</s><strong>$43.00/hr</strong><small>includes $5 bonus</small></div>
                <div className="total">About $344 for 8 hours</div>
                <a className="claim" href="/apply">Apply to claim shifts</a>
              </article>
              <article className="shift">
                <div className="top"><span className="chip">Long-term care</span><span className="chip">1 of 1 open</span></div>
                <div className="role">Registered Nurse</div>
                <div className="when">Mon &middot; 11:00 PM to 7:00 AM</div>
                <div className="pay"><strong>$52.00/hr</strong></div>
                <div className="total">About $416 for 8 hours</div>
                <a className="claim" href="/apply">Apply to claim shifts</a>
              </article>
            </div>
            <p className="note">
              Example shifts to show the layout. Real rates are set by each facility, and we
              confirm every claim before it counts.
            </p>
          </div>
        </section>

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

        <section>
          <div className="wrap">
            <div className="head">
              <p className="eyebrow">Why it works</p>
              <h2>Built around trust on both sides</h2>
            </div>
            <div className="bento">
              <div className="tile a dark">
                <p className="eyebrow">Verification</p>
                <h3>Checked before the first shift</h3>
                <p>
                  License, two professional references and a background check come first. The
                  physical and TB test follow, only after approval.
                </p>
                <div className="chips">
                  <span>License</span><span>References</span><span>Background check</span><span>Physical and TB</span>
                </div>
              </div>
              <div className="tile b">
                <p className="eyebrow">Transparency</p>
                <h3>Workers see their pay before they claim</h3>
                <p>
                  Rate, bonus and total for the shift appear on the card. The facility name shows
                  once a claim is confirmed.
                </p>
              </div>
              <div className="tile c">
                <div className="big">RN &middot; LPN &middot; LNA</div>
                <h3>Roles to start</h3>
                <p>Plus dietary, housekeeping and activities staff.</p>
              </div>
              <div className="tile d">
                <div className="big">NH</div>
                <h3>Local first</h3>
                <p>We are starting in {BRAND.region} and will grow one state at a time.</p>
              </div>
              <div className="tile e">
                <h3>Made for your phone</h3>
                <p>
                  Apply, check your status and claim shifts from any phone browser. A mobile app is
                  on the way.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="band">
          <div className="wrap">
            <div className="head">
              <p className="eyebrow">How it works</p>
              <h2>Pick your side to see the steps</h2>
            </div>
            <HowTabs />
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

        <section id="careers">
          <div className="wrap">
            <h2>Nurses and care staff: work with {BRAND.name}</h2>
            <p className="lead">
              Pick up shifts at {BRAND.region} facilities, see your hourly rate before you claim a
              shift, and keep more of what the facility pays. Applying is free.
            </p>
            <a className="btn cta-big" href="/apply">Apply today</a>{" "}
            <a className="btn outline" href="/careers">Learn more</a>
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
      <div className="dockpad" aria-hidden="true" />
      <div className="dock">
        <a className="btn pill ghost" href="#contact">Request staffing</a>
        <a className="btn pill" href="/apply">Apply today</a>
      </div>
    </>
  );
}
