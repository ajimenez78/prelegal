import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Prelegal",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="wordmark">Prelegal</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-intro">Sign in to continue drafting your agreements.</p>
        <LoginForm />
        <p className="login-switch">
          New to Prelegal? <Link href="/signup/">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
