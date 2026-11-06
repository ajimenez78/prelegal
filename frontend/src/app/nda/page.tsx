import type { Metadata } from "next";
import { NdaBuilder } from "@/components/NdaBuilder";
import { loadNdaTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Mutual NDA | Prelegal",
};

export default function NdaPage() {
  return <NdaBuilder {...loadNdaTemplates()} />;
}
