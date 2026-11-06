import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { toDocument, type CatalogEntry, type DocumentInfo } from "./documents";

/** The repository root, one level above frontend/. */
const ROOT = path.join(process.cwd(), "..");

function readTemplate(filename: string): string {
  return readFileSync(path.join(ROOT, "templates", filename), "utf-8");
}

/**
 * Load every supported document from catalog.json. Synchronous reads complete
 * during prerendering, so the page is statically generated at build time.
 * The NDA cover page is filled separately, so it is not a document of its own.
 */
export function loadDocuments(): DocumentInfo[] {
  const catalog: { templates: CatalogEntry[] } = JSON.parse(
    readFileSync(path.join(ROOT, "catalog.json"), "utf-8"),
  );
  return catalog.templates
    .filter((entry) => !entry.filename.endsWith("-coverpage.md"))
    .map((entry) => toDocument(entry, readTemplate(entry.filename)));
}

export function loadNdaCoverPage(): string {
  return readTemplate("Mutual-NDA-coverpage.md");
}
