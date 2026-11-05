import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prepareStandardTerms } from "./nda";

/** The repository's shared templates directory (one level above frontend/). */
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

function readTemplate(filename: string): string {
  return readFileSync(path.join(TEMPLATES_DIR, filename), "utf-8");
}

/**
 * Load the Mutual NDA templates. Synchronous reads complete during
 * prerendering, so the page is statically generated at build time.
 * The standard terms need no form data, so they are returned ready to render.
 */
export function loadNdaTemplates() {
  return {
    coverPageTemplate: readTemplate("Mutual-NDA-coverpage.md"),
    standardTerms: prepareStandardTerms(readTemplate("Mutual-NDA.md")),
  };
}
