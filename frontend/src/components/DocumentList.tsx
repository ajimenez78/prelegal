"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type SavedSummary } from "@/lib/api";
import { useRequireUser } from "@/lib/auth";
import { AppHeader } from "./AppHeader";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

interface DocumentListProps {
  /** Catalog document names by id. */
  names: Record<string, string>;
}

/** The signed-in user's saved documents, newest first. */
export function DocumentList({ names }: DocumentListProps) {
  const email = useRequireUser();
  const [documents, setDocuments] = useState<SavedSummary[] | null>(null);

  useEffect(() => {
    if (!email) return;
    api("/documents")
      .then((response) => response.json())
      .then(setDocuments);
  }, [email]);

  if (!email) return null;

  return (
    <div className="page">
      <AppHeader email={email}>
        <Link href="/draft/" className="primary-button">
          New document
        </Link>
      </AppHeader>
      <main className="page-main">
        <div className="page-heading">
          <h1>Your documents</h1>
          <p>Every draft is saved as you chat. Open one to pick up where you left off.</p>
        </div>
        {documents === null ? (
          <p className="page-loading">Loading your documents...</p>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h2>No documents yet</h2>
            <p>Tell the assistant what you need and it will draft it with you.</p>
            <Link href="/draft/" className="primary-button">
              Draft your first document
            </Link>
          </div>
        ) : (
          <ul className="doc-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link href={`/draft/?id=${doc.id}`} className="doc-card">
                  <span className="doc-card-title">{doc.title}</span>
                  <span className="doc-card-meta">
                    {names[doc.documentType]} · Edited {formatDate(doc.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
