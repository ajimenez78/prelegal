import type { Metadata } from "next";
import { DocumentList } from "@/components/DocumentList";
import { loadDocuments } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Your documents | Prelegal",
};

export default function DocumentsPage() {
  const names = Object.fromEntries(loadDocuments().map((doc) => [doc.id, doc.name]));
  return <DocumentList names={names} />;
}
