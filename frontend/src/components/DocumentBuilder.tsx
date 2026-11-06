"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  applyReply,
  emptyDraft,
  toChatFields,
  type ChatContext,
  type ChatReply,
  type DocumentSummary,
  type Draft,
} from "@/lib/chat";
import { chatTerms, NDA_ID, type DocumentInfo } from "@/lib/documents";
import { keyTermsCoverPage, keyTermsTitle } from "@/lib/keyterms";
import { documentTitle, fillCoverPage } from "@/lib/nda";
import { DocumentChat } from "./DocumentChat";
import { DocumentPreview } from "./DocumentPreview";

function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const subscribeNoop = () => () => {};

/**
 * Today's date in the viewer's timezone. The server snapshot is empty so the
 * prerendered page never depends on the build machine's clock (Cache
 * Components rejects timestamps during prerender). Unlike setting state in a
 * useEffect, this hydrates safely without an extra render pass.
 */
function useToday(): string {
  return useSyncExternalStore(subscribeNoop, todayIso, () => "");
}

/** The chosen document's cover page and the title used for the PDF. */
function preview(doc: DocumentInfo, draft: Draft, ndaCoverPage: string, today: string) {
  if (doc.id === NDA_ID) {
    // An empty effective date means "today" until the chat sets one.
    const data = { ...draft.nda, effectiveDate: draft.nda.effectiveDate || today };
    return { coverPage: fillCoverPage(ndaCoverPage, data), title: documentTitle(data) };
  }
  return {
    coverPage: keyTermsCoverPage(doc, draft.terms),
    title: keyTermsTitle(doc, draft.terms),
  };
}

function summary(doc: DocumentInfo): DocumentSummary {
  return { id: doc.id, name: doc.name, description: doc.description, terms: chatTerms(doc) };
}

interface DocumentBuilderProps {
  documents: DocumentInfo[];
  ndaCoverPage: string;
}

export function DocumentBuilder({ documents, ndaCoverPage }: DocumentBuilderProps) {
  const today = useToday();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const doc = documents.find((d) => d.id === draft.documentId);
  const shown = doc && preview(doc, draft, ndaCoverPage, today);

  const chatContext: ChatContext = {
    documentType: doc?.id ?? null,
    // The raw NDA form is sent so an empty effective date still means "today".
    fields: toChatFields(draft.nda),
    terms: Object.entries(draft.terms).map(([term, value]) => ({ term, value })),
    documents: documents.map(summary),
  };

  function handleReply(reply: ChatReply) {
    setDraft((prev) => applyReply(prev, reply));
  }

  function handleDownload() {
    // Browsers use the document title as the default PDF filename. Restore it
    // on `afterprint`, since print() does not block in every browser.
    const previousTitle = document.title;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previousTitle;
      },
      { once: true },
    );
    document.title = shown!.title;
    window.print();
  }

  return (
    <div className="builder">
      <header className="app-header">
        <p className="wordmark">Prelegal</p>
        <h1>{doc?.name ?? "New document"}</h1>
        <button
          type="button"
          className="primary-button"
          onClick={handleDownload}
          disabled={!shown}
        >
          Download PDF
        </button>
        <Link href="/" className="header-link">
          Sign out
        </Link>
      </header>
      <aside className="form-panel" aria-label="Document assistant">
        <DocumentChat context={chatContext} onReply={handleReply} />
      </aside>
      <main className="desk">
        <div className="sheet">
          {shown ? (
            <DocumentPreview
              title={doc!.name}
              coverPage={shown.coverPage}
              standardTerms={doc!.standardTerms}
            />
          ) : (
            <p className="empty-preview">
              Tell the assistant which document you need, and it will appear here.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
