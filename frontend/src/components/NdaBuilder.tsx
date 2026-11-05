"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  createDefaultFormData,
  documentTitle,
  fillCoverPage,
  type NdaFormData,
  type Party,
} from "@/lib/nda";
import { NdaDocument } from "./NdaDocument";
import { NdaForm } from "./NdaForm";

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
  // An empty effective date means "today" until the user picks one.
  const [form, setForm] = useState<NdaFormData>(() => createDefaultFormData(""));
  const data = useMemo(
    () => ({ ...form, effectiveDate: form.effectiveDate || today }),
    [form, today],
  );
  const coverPage = useMemo(
    () => fillCoverPage(coverPageTemplate, data),
    [coverPageTemplate, data],
  );

  function handleChange<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handlePartyChange(index: 0 | 1, key: keyof Party, value: string) {
    setForm((prev) => {
      const parties: [Party, Party] = [...prev.parties];
      parties[index] = { ...parties[index], [key]: value };
      return { ...prev, parties };
    });
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
        <button type="button" className="download-button" onClick={handleDownload}>
          Download PDF
        </button>
      </header>
      <aside className="form-panel" aria-label="NDA details">
        <p className="form-intro">
          Fill in the details and the agreement updates as you type. Leave
          signatures and dates blank for each party to complete when signing.
        </p>
        <NdaForm
          data={data}
          onChange={handleChange}
          onPartyChange={handlePartyChange}
        />
      </aside>
      <main className="desk">
        <div className="sheet">
          <NdaDocument coverPage={coverPage} standardTerms={standardTerms} />
        </div>
      </main>
    </div>
  );
}
