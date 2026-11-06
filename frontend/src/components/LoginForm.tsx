"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

const COPY = {
  login: { submit: "Sign in", pending: "Signing in...", failed: "Sign in failed. Please try again." },
  signup: {
    submit: "Create account",
    pending: "Creating account...",
    failed: "Sign up failed. Please try again.",
  },
};

/** The server explains wrong credentials (401) and a taken email (409). */
async function errorMessage(response: Response | null, fallback: string): Promise<string> {
  if (response?.status === 401 || response?.status === 409) {
    return (await response.json()).detail;
  }
  return fallback;
}

interface LoginFormProps {
  mode?: "login" | "signup";
}

/** Sign in or sign up. Either way the user lands on their documents. */
export function LoginForm({ mode = "login" }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    const credentials = { email: form.get("email"), password: form.get("password") };
    const response = await api(`/${mode}`, "POST", credentials).catch(() => null);
    if (!response?.ok) {
      setError(await errorMessage(response, copy.failed));
      setPending(false);
      return;
    }
    router.push("/documents/");
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span className="field-label">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          aria-describedby={mode === "signup" ? "password-hint" : undefined}
          required
        />
      </label>
      {mode === "signup" && (
        <p id="password-hint" className="field-hint">
          At least 8 characters.
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button" disabled={pending}>
        {pending ? copy.pending : copy.submit}
      </button>
    </form>
  );
}
