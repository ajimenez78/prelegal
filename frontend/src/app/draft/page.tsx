import type { Metadata } from "next";
import { Suspense } from "react";
import { DraftLoader } from "@/components/DraftLoader";
import { loadDocuments, loadNdaCoverPage } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Draft a document | Prelegal",
};

// useSearchParams in DraftLoader needs a Suspense boundary in a static export.
export default function DraftPage() {
  return (
    <Suspense>
      <DraftLoader documents={loadDocuments()} ndaCoverPage={loadNdaCoverPage()} />
    </Suspense>
  );
}
