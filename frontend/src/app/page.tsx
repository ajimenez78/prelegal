import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Prelegal",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="wordmark">Prelegal</p>
        <h1 id="login-title">Sign in</h1>
        <p className="login-intro">Draft common legal agreements in minutes.</p>
        <LoginForm />
      </section>
    </main>
  );
}
