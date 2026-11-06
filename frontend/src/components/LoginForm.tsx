"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * Fake sign in: the backend accepts any credentials for now, so a successful
 * response simply brings the user into the platform.
 */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);
    if (!response?.ok) {
      setError("Sign in failed. Please try again.");
      setPending(false);
      return;
    }
    router.push("/nda/");
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
