import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function Login() {
  return (
    <main>
      <section>
        <div className="wrap">
          <h2>Sign in</h2>
          <p className="lead">Staff access only. We will email you a one-time link.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
