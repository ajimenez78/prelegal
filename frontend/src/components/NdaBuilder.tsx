"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { applyChatUpdates, toChatFields, type ChatUpdates } from "@/lib/chat";
import {
  createDefaultFormData,
  documentTitle,
  fillCoverPage,
  type NdaFormData,
} from "@/lib/nda";
import { NdaChat } from "./NdaChat";
import { NdaDocument } from "./NdaDocument";

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

interface NdaBuilderProps {
  coverPageTemplate: string;
  standardTerms: string;
}

export function NdaBuilder({ coverPageTemplate, standardTerms }: NdaBuilderProps) {
  const today = useToday();
  // An empty effective date means "today" until the chat sets one.
  const [form, setForm] = useState<NdaFormData>(() => createDefaultFormData(""));
  const data = useMemo(
    () => ({ ...form, effectiveDate: form.effectiveDate || today }),
    [form, today],
  );
  const coverPage = useMemo(
    () => fillCoverPage(coverPageTemplate, data),
    [coverPageTemplate, data],
  );

  function handleUpdates(updates: ChatUpdates) {
    setForm((prev) => applyChatUpdates(prev, updates));
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
    document.title = documentTitle(data);
    window.print();
  }

  return (
    <div className="builder">
      <header className="app-header">
        <p className="wordmark">Prelegal</p>
        <h1>Mutual NDA</h1>
        <button type="button" className="primary-button" onClick={handleDownload}>
          Download PDF
        </button>
        <Link href="/" className="header-link">
          Sign out
        </Link>
      </header>
      <aside className="form-panel" aria-label="NDA assistant">
        {/* The raw form is sent so an empty effective date still means "today". */}
        <NdaChat fields={toChatFields(form)} onUpdates={handleUpdates} />
      </aside>
      <main className="desk">
        <div className="sheet">
          <NdaDocument coverPage={coverPage} standardTerms={standardTerms} />
        </div>
      </main>
    </div>
  );
}
