"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * The signed-in user's email, or null while it loads. Sends the visitor to
 * the sign in page when there is no session.
 */
export function useRequireUser(): string | null {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    api("/me").then(async (response) => {
      if (!response.ok) {
        router.replace("/");
        return;
      }
      setEmail((await response.json()).email);
    });
  }, [router]);

  return email;
}
