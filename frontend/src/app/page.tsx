import { NdaBuilder } from "@/components/NdaBuilder";
import { loadNdaTemplates } from "@/lib/templates";

export default function Home() {
  return <NdaBuilder {...loadNdaTemplates()} />;
}
