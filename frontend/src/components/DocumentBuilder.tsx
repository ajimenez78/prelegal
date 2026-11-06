"use client";

import { useState, useSyncExternalStore } from "react";
import { api, type SavedDocument } from "@/lib/api";
import {
  applyReply,
  emptyDraft,
  toChatFields,
  type ChatContext,
  type ChatReply,
  type DocumentSummary,
  type Draft,
  type Message,
} from "@/lib/chat";
import { chatTerms, NDA_ID, type DocumentInfo } from "@/lib/documents";
import { keyTermsCoverPage, keyTermsTitle } from "@/lib/keyterms";
import { documentTitle, fillCoverPage } from "@/lib/nda";
import { AppHeader } from "./AppHeader";
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

/** A readable title for the documents list: the companies, else the document name. */
function savedTitle(doc: DocumentInfo, draft: Draft): string {
  const companies =
    doc.id === NDA_ID
      ? draft.nda.parties.map((party) => party.company)
      : doc.roles.map((role) => draft.terms[role] ?? "");
  return companies.filter(Boolean).join(" and ") || doc.name;
}

function summary(doc: DocumentInfo): DocumentSummary {
  return { id: doc.id, name: doc.name, description: doc.description, terms: chatTerms(doc) };
}

interface DocumentBuilderProps {
  documents: DocumentInfo[];
  ndaCoverPage: string;
  email: string;
  /** The saved document to continue. Omitted for a new document. */
  saved?: SavedDocument;
}

export function DocumentBuilder({ documents, ndaCoverPage, email, saved }: DocumentBuilderProps) {
  const today = useToday();
  const [draft, setDraft] = useState<Draft>(saved?.draft ?? emptyDraft);
  const [savedId, setSavedId] = useState<number | null>(saved?.id ?? null);
  const [saveError, setSaveError] = useState("");
  const doc = documents.find((d) => d.id === draft.documentId);
  const shown = doc && preview(doc, draft, ndaCoverPage, today);

  const chatContext: ChatContext = {
    documentType: doc?.id ?? null,
    // The raw NDA form is sent so an empty effective date still means "today".
    fields: toChatFields(draft.nda),
    terms: Object.entries(draft.terms).map(([term, value]) => ({ term, value })),
    documents: documents.map(summary),
  };

  /** Apply the reply, then save the draft and chat once a document is chosen:
   * created on the first save, updated after that. */
  async function handleReply(reply: ChatReply, messages: Message[]) {
    const next = applyReply(draft, reply);
    setDraft(next);
    const nextDoc = documents.find((d) => d.id === next.documentId);
    if (!nextDoc) return;
    const body = {
      documentType: nextDoc.id,
      title: savedTitle(nextDoc, next),
      draft: next,
      messages,
    };
    const response = await api(
      savedId ? `/documents/${savedId}` : "/documents",
      savedId ? "PUT" : "POST",
      body,
    ).catch(() => null);
    setSaveError(response?.ok ? "" : "Your latest changes could not be saved.");
    if (response?.ok && !savedId) setSavedId((await response.json()).id);
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
      <AppHeader email={email} title={doc?.name ?? "New document"}>
        {saveError ? (
          <span className="save-status save-status-error" role="alert">
            {saveError}
          </span>
        ) : (
          savedId && <span className="save-status">Saved</span>
        )}
        <button
          type="button"
          className="primary-button"
          onClick={handleDownload}
          disabled={!shown}
        >
          Download PDF
        </button>
      </AppHeader>
      <aside className="form-panel" aria-label="Document assistant">
        <DocumentChat
          context={chatContext}
          initialMessages={saved?.messages}
          onReply={handleReply}
        />
      </aside>
      <main className="desk">
        <p className="draft-banner" role="note">
          <strong>Draft only.</strong> Documents created with Prelegal are drafts and are
          subject to legal review before they are signed or relied on.
        </p>
        <div className="sheet">
          {shown ? (
            <DocumentPreview
              title={doc!.name}
              coverPage={shown.coverPage}
              standardTerms={doc!.standardTerms}
            />
          ) : (
            <div className="empty-preview">
              <h2>Your document will appear here</h2>
              <p>Tell the assistant which agreement you need. You can draft any of these:</p>
              <ul>
                {documents.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
