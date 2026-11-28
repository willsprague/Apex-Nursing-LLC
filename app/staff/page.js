import StaffForm from "./StaffForm";

export const metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default function Staff() {
  return (
    <main>
      <section>
        <div className="wrap">
          <h2>Staff sign in</h2>
          <p className="lead">For Apixora staff only. Nurses and facilities sign in with an emailed code.</p>
          <StaffForm />
        </div>
      </section>
    </main>
  );
}
