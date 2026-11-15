import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function Login() {
  return (
    <main>
      <section>
        <div className="wrap">
          <h2>Sign in</h2>
          <p className="lead">Facilities and staff: enter your email and we will send a one-time link. New here? The same link creates your account.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
