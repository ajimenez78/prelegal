import { describe, expect, it } from "vitest";
import type { DocumentInfo } from "./documents";
import { keyTermsCoverPage, keyTermsTitle } from "./keyterms";

const doc: DocumentInfo = {
  id: "CSA",
  name: "Cloud Service Agreement",
  description: "",
  roles: ["Provider", "Customer"],
  terms: ["Provider", "Customer", "Subscription Period", "Governing Law"],
  standardTerms: "",
};

describe("keyTermsCoverPage", () => {
  it("shows a blank to fill in for every empty term", () => {
    const page = keyTermsCoverPage(doc, {});
    expect(page).toContain("# Key Terms");
    expect(page).toContain("| Subscription Period | [Fill in] |");
    expect(page).toContain("| Provider | [Fill in] |");
    expect(page).toContain("| | PROVIDER | CUSTOMER |");
  });

  it("shows filled terms as filled fields", () => {
    const page = keyTermsCoverPage(doc, { "Subscription Period": "12 months" });
    expect(page).toContain("| Subscription Period | ` 12 months ` |");
  });

  it("escapes pipes so a value cannot break the table", () => {
    const page = keyTermsCoverPage(doc, { "Governing Law": "A | B" });
    expect(page).toContain("| Governing Law | ` A \\| B ` |");
  });

  it("fills the signature table from the role and signer terms", () => {
    const page = keyTermsCoverPage(doc, {
      Provider: "Acme Cloud",
      "Provider Signer Name": "Jane Doe",
      "Customer Signer Title": "CTO",
      "Customer Notice Address": "1 Main St",
    });
    expect(page).toContain("| Company | ` Acme Cloud ` |  |");
    expect(page).toContain("| Print Name | ` Jane Doe ` |  |");
    expect(page).toContain("| Title |  | ` CTO ` |");
    expect(page).toContain("| Notice Address |  | ` 1 Main St ` |");
  });
});

describe("keyTermsTitle", () => {
  it("names the PDF after the document and the parties", () => {
    expect(keyTermsTitle(doc, { Provider: "Acme Cloud", Customer: "Globex, Inc." })).toBe(
      "Cloud-Service-Agreement-Acme-Cloud-Globex-Inc",
    );
    expect(keyTermsTitle(doc, {})).toBe("Cloud-Service-Agreement");
  });
});
