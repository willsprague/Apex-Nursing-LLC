import { BRAND } from "../../../lib/brand";

export const metadata = { title: `Application submitted | ${BRAND.name}`, robots: { index: false, follow: false } };

export default function Thanks() {
  return (
    <main><section><div className="wrap">
      <h2>Thank you, your application is submitted</h2>
      <p className="lead">
        Your information is being reviewed. We will follow up with an update by email. You can also
        check where your application stands any time.
      </p>
      <p>
        <a className="btn" href="/apply">View my application status</a>{" "}
        <a className="btn outline" href="/">Back to home</a>
      </p>
    </div></section></main>
  );
}
