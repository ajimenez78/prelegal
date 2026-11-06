import type { Metadata } from "next";
import { DocumentBuilder } from "@/components/DocumentBuilder";
import { loadDocuments, loadNdaCoverPage } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Draft a document | Prelegal",
};

export default function DraftPage() {
  return <DocumentBuilder documents={loadDocuments()} ndaCoverPage={loadNdaCoverPage()} />;
}
