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
      <ApplyForm />
    </div></section></main>
  );
}
