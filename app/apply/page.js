import ApplyForm from "./ApplyForm";
import { BRAND } from "../../lib/brand";

export const metadata = {
  title: `Apply to work with ${BRAND.name}`,
  robots: { index: false, follow: false },
};

export default function Apply() {
  return (
    <main><section><div className="wrap">
      <p><a href="/">&larr; Back to home</a></p>
      <h2>Apply to work with {BRAND.name}</h2>
      <p className="lead">
        Nurses and care staff: tell us about yourself and the shifts you want. We review every
        application, check your license, and email you about next steps. Applying is free.
      </p>
      <h3>What happens after you apply</h3>
      <ol>
        <li>We review your application, check your license, and contact your professional references.</li>
        <li>With your written permission, we run a background check.</li>
        <li>If you pass, we approve you and send you to an urgent care partner for a physical and a TB test. We do not ask for these until you are approved.</li>
        <li>When your health screening is done, you create your worker account and can start claiming shifts.</li>
      </ol>
      <ApplyForm />
    </div></section></main>
  );
}
