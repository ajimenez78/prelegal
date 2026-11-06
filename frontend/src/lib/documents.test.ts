import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chatTerms, extractTerms, NDA_ID, rolesOf, toDocument, type CatalogEntry } from "./documents";

const root = path.resolve(import.meta.dirname, "../../..");
const readTemplate = (filename: string) =>
  readFileSync(path.join(root, "templates", filename), "utf-8");
const catalog: CatalogEntry[] = JSON.parse(
  readFileSync(path.join(root, "catalog.json"), "utf-8"),
).templates;

const span = (cls: string, text: string) => `<span class="${cls}_link">${text}</span>`;

describe("extractTerms", () => {
  it("lists the roles first, then each referenced term once", () => {
    const template = [
      span("keyterms", "Governing Law"),
      span("coverpage", "Customer"),
      span("orderform", "Subscription Period"),
      span("keyterms", "Governing Law"),
    ].join(" ");
    expect(extractTerms(template, ["Provider", "Customer"])).toEqual([
      "Provider",
      "Customer",
      "Governing Law",
      "Subscription Period",
    ]);
  });

  it("strips possessives and merges plurals into their singular", () => {
    const template = [
      span("keyterms", "Provider’s"),
      span("keyterms", "Chosen Court"),
      span("keyterms", "Chosen Courts"),
      span("sow", "Fees"),
    ].join(" ");
    expect(extractTerms(template, ["Provider", "Customer"])).toEqual([
      "Provider",
      "Customer",
      "Chosen Court",
      "Fees",
    ]);
  });

  it("leaves notice addresses to the signer terms", () => {
    const template = span("orderform", "Notice Address");
    expect(extractTerms(template, ["Provider", "Customer"])).toEqual(["Provider", "Customer"]);
  });
});

describe("toDocument", () => {
  const entry = (filename: string) => catalog.find((e) => e.filename === filename)!;

  it("builds a key-terms document from a template", () => {
    const doc = toDocument(entry("CSA.md"), readTemplate("CSA.md"));
    expect(doc.id).toBe("CSA");
    expect(doc.name).toBe("Cloud Service Agreement");
    expect(doc.roles).toEqual(["Provider", "Customer"]);
    expect(doc.terms.slice(0, 3)).toEqual(["Provider", "Customer", "Subscription Period"]);
    expect(chatTerms(doc)).toEqual([
      ...doc.terms,
      "Provider Signer Name",
      "Provider Signer Title",
      "Provider Notice Address",
      "Customer Signer Name",
      "Customer Signer Title",
      "Customer Notice Address",
    ]);
    expect(doc.standardTerms).not.toContain("<span");
    expect(doc.standardTerms).toContain("**Subscription Period**");
  });

  it("keeps the NDA on its own cover page", () => {
    const doc = toDocument(entry("Mutual-NDA.md"), readTemplate("Mutual-NDA.md"));
    expect(doc.id).toBe(NDA_ID);
    expect(doc.name).toBe("Mutual Non-Disclosure Agreement");
    expect(doc.terms).toEqual([]);
    expect(chatTerms(doc)).toEqual([]);
  });

  const ids = catalog
    .map((e) => e.filename.replace(/\.md$/, ""))
    .filter((id) => id !== NDA_ID && !id.endsWith("coverpage"));

  it("covers the ten documents besides the NDA", () => {
    expect(ids).toHaveLength(10);
  });

  it("names every party role as it appears in its template", () => {
    for (const id of ids) {
      const template = readTemplate(`${id}.md`);
      for (const role of rolesOf(id)) {
        expect(template, `${id}: ${role}`).toContain(`>${role}</span>`);
      }
    }
  });
});
