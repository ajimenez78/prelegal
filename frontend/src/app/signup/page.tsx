import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Create an account | Prelegal",
};

export default function SignupPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="signup-title">
        <p className="wordmark">Prelegal</p>
        <h1 id="signup-title">Create your account</h1>
        <p className="login-intro">Draft common legal agreements in minutes with AI.</p>
        <LoginForm mode="signup" />
        <p className="login-switch">
          Already have an account? <Link href="/">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
