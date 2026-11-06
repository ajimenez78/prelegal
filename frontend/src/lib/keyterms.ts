/**
 * Generated "Key Terms" cover page for documents whose templates only contain
 * standard terms: a table of the terms they reference plus the signatures.
 */
import { signerTerm, type DocumentInfo } from "./documents";
import { fileTitle, signatureTable, tableField, type Party } from "./nda";

/** Term values by exact term name. */
export type TermValues = Record<string, string>;

const BLANK = "[Fill in]";

function party(role: string, values: TermValues): Party {
  const value = (field: string) => values[signerTerm(role, field)] ?? "";
  return {
    company: values[role] ?? "",
    name: value("Signer Name"),
    title: value("Signer Title"),
    noticeAddress: value("Notice Address"),
  };
}

export function keyTermsCoverPage(doc: DocumentInfo, values: TermValues): string {
  const rows = doc.terms.map((term) => `| ${term} | ${tableField(values[term] ?? "") || BLANK} |`);
  const [role1, role2] = doc.roles;
  return [
    "# Key Terms",
    `These key terms complete the ${doc.name} standard terms that follow.`,
    ["| Term | Value |", "|:--- |:--- |", ...rows].join("\n"),
    "## Signatures",
    signatureTable(
      [party(role1, values), party(role2, values)],
      [role1.toUpperCase(), role2.toUpperCase()],
    ),
  ].join("\n\n");
}

export function keyTermsTitle(doc: DocumentInfo, values: TermValues): string {
  return fileTitle(doc.name, doc.roles.map((role) => values[role] ?? ""));
}
