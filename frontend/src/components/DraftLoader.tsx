"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type SavedDocument } from "@/lib/api";
import { useRequireUser } from "@/lib/auth";
import type { DocumentInfo } from "@/lib/documents";
import { DocumentBuilder } from "./DocumentBuilder";

interface DraftLoaderProps {
  documents: DocumentInfo[];
  ndaCoverPage: string;
}

/**
 * Opens the builder for a new document, or for the saved one in `?id=`. The
 * static export has no dynamic routes, so the id is a query parameter.
 */
export function DraftLoader({ documents, ndaCoverPage }: DraftLoaderProps) {
  const id = useSearchParams().get("id");
  const email = useRequireUser();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedDocument | null>(null);

  useEffect(() => {
    if (!email || !id) return;
    api(`/documents/${id}`).then(async (response) => {
      if (!response.ok) {
        router.replace("/documents/");
        return;
      }
      setSaved(await response.json());
    });
  }, [email, id, router]);

  if (!email || (id && String(saved?.id) !== id)) return null;
  return (
    <DocumentBuilder
      key={id ?? "new"}
      documents={documents}
      ndaCoverPage={ndaCoverPage}
      email={email}
      saved={id ? saved! : undefined}
    />
  );
}
