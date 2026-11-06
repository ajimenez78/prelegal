/**
 * The supported documents, built from catalog.json and the templates. Pure,
 * so it can be unit tested; templates.ts does the file reading.
 */
import { prepareStandardTerms } from "./nda";

export const NDA_ID = "Mutual-NDA";

export interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

export interface DocumentInfo {
  id: string;
  name: string;
  description: string;
  /** The two parties, as named in the template. */
  roles: [string, string];
  /** Key terms referenced by the template, starting with the two roles. */
  terms: string[];
  standardTerms: string;
}

/** Party roles, where they differ from Provider and Customer. */
export const ROLES: Record<string, [string, string]> = {
  BAA: ["Provider", "Company"],
  "design-partner-agreement": ["Provider", "Partner"],
  "Partnership-Agreement": ["Company", "Partner"],
};

export const rolesOf = (id: string): [string, string] => ROLES[id] ?? ["Provider", "Customer"];

const TERM_SPAN = /<span class="[a-z]+_link">(.*?)<\/span>/g;
const SIGNER_FIELDS = ["Signer Name", "Signer Title", "Notice Address"];

export const signerTerm = (role: string, field: string) => `${role} ${field}`;

/**
 * Distinct terms the template references, roles first and plurals merged.
 * Party details such as notice addresses are covered by the signer terms.
 */
export function extractTerms(template: string, roles: string[]): string[] {
  const names = new Set(
    [...template.matchAll(TERM_SPAN)].map((m) => m[1].replace(/[’']s$/, "")),
  );
  const skip = (name: string) =>
    roles.includes(name) ||
    SIGNER_FIELDS.includes(name) ||
    (name.endsWith("s") && names.has(name.slice(0, -1)));
  return [...roles, ...[...names].filter((name) => !skip(name))];
}

/** Everything the AI collects for a document: key terms, then signatory details. */
export function chatTerms(doc: DocumentInfo): string[] {
  const signer = doc.roles.flatMap((role) => SIGNER_FIELDS.map((f) => signerTerm(role, f)));
  return doc.terms.length ? [...doc.terms, ...signer] : [];
}

/** The NDA has no key terms: it fills its own cover page instead. */
export function toDocument(entry: CatalogEntry, template: string): DocumentInfo {
  const id = entry.filename.replace(/\.md$/, "");
  const roles = rolesOf(id);
  return {
    id,
    name: entry.name.replace(/ - Standard Terms$/, ""),
    description: entry.description,
    roles,
    terms: id === NDA_ID ? [] : extractTerms(template, roles),
    standardTerms: prepareStandardTerms(template),
  };
}
