"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { api } from "@/lib/api";

interface AppHeaderProps {
  email: string;
  title?: string;
  /** Page actions, shown before the account menu. */
  children?: ReactNode;
}

/** The signed-in header shared by the documents page and the builder. */
export function AppHeader({ email, title, children }: AppHeaderProps) {
  const router = useRouter();

  async function signOut() {
    await api("/logout", "POST");
    router.push("/");
  }

  return (
    <header className="app-header">
      <Link href="/documents/" className="wordmark">
        Prelegal
      </Link>
      {title && <h1>{title}</h1>}
      <div className="header-actions">
        {children}
        <span className="header-user" title={email}>
          {email}
        </span>
        <button type="button" className="header-link" onClick={signOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
