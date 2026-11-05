import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDefaultFormData,
  documentTitle,
  fillCoverPage,
  formatDate,
  formatYears,
  prepareStandardTerms,
  type NdaFormData,
} from "./nda";

const templatesDir = path.resolve(import.meta.dirname, "../../../templates");
const coverTemplate = readFileSync(
  path.join(templatesDir, "Mutual-NDA-coverpage.md"),
  "utf-8",
);
const termsTemplate = readFileSync(
  path.join(templatesDir, "Mutual-NDA.md"),
  "utf-8",
);

function formData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...createDefaultFormData("2026-11-05"),
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    parties: [
      {
        name: "Ada Lovelace",
        title: "CEO",
        company: "Acme Inc.",
        noticeAddress: "ada@acme.example",
      },
      {
        name: "Alan Turing",
        title: "CTO",
        company: "Globex Corp",
        noticeAddress: "1 Main St, Springfield",
      },
    ],
    ...overrides,
  };
}

describe("formatting helpers", () => {
  it("formats ISO dates without timezone drift", () => {
    expect(formatDate("2026-11-05")).toBe("November 5, 2026");
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatDate("")).toBe("");
  });

  it("pluralises years", () => {
    expect(formatYears(1)).toBe("1 year");
    expect(formatYears(3)).toBe("3 years");
  });
});

describe("fillCoverPage", () => {
  it("fills every placeholder from the form", () => {
    const md = fillCoverPage(coverTemplate, formData());

    expect(md).toContain(
      "` Evaluating whether to enter into a business relationship with the other party. `",
    );
    expect(md).toContain("` November 5, 2026 `");
    expect(md).toContain("Governing Law: ` Delaware `");
    expect(md).toContain("Jurisdiction: ` courts located in New Castle, DE `");
    expect(md).toContain("None.");
    expect(md).not.toContain("[Today’s date]");
    expect(md).not.toContain("[Fill in state]");
    expect(md).not.toContain("[1 year(s)]");
  });

  it("removes the template's inline HTML", () => {
    const md = fillCoverPage(coverTemplate, formData());
    expect(md).not.toMatch(/<\/?label>/);
    expect(md).toContain("_How Confidential Information may be used_");
  });

  it("checks the chosen MNDA term and confidentiality term", () => {
    const fixed = fillCoverPage(
      coverTemplate,
      formData({ mndaTermYears: 2, confidentialityYears: 5 }),
    );
    expect(fixed).toContain("- [x] Expires ` 2 years ` from Effective Date.");
    expect(fixed).toContain("- [ ] Continues until terminated");
    expect(fixed).toContain("- [x] ` 5 years ` from Effective Date");
    expect(fixed).toContain("- [ ] In perpetuity.");

    const open = fillCoverPage(
      coverTemplate,
      formData({ mndaTerm: "untilTerminated", confidentialityTerm: "perpetual" }),
    );
    expect(open).toContain("- [ ] Expires");
    expect(open).toContain("- [x] Continues until terminated");
    expect(open).toContain("- [x] In perpetuity.");
  });

  it("builds the signature table with both parties", () => {
    const md = fillCoverPage(coverTemplate, formData());
    expect(md).toContain("| Print Name | ` Ada Lovelace ` | ` Alan Turing ` |");
    expect(md).toContain("| Company | ` Acme Inc. ` | ` Globex Corp ` |");
    expect(md).toContain("| Signature |  |  |");
    expect(md).toContain("| Date |  |  |");
    expect(md).not.toContain("|| PARTY 1");
  });

  it("keeps template placeholders for fields left empty", () => {
    const md = fillCoverPage(
      coverTemplate,
      formData({ governingLaw: "", jurisdiction: " ", effectiveDate: "" }),
    );
    expect(md).toContain("[Fill in state]");
    expect(md).toContain("[Fill in city or county and state");
    expect(md).toContain("[Today’s date]");
  });

  it("neutralises user input that could break the markdown", () => {
    const md = fillCoverPage(
      coverTemplate,
      formData({
        governingLaw: "<script>alert(1)</script> $& `x`",
        parties: [
          { name: "A | B", title: "", company: "", noticeAddress: "" },
          { name: "", title: "", company: "", noticeAddress: "" },
        ],
      }),
    );
    // Wrapped in a longer fence so the backticks stay literal; `$&` not expanded.
    expect(md).toContain("Governing Law: `` <script>alert(1)</script> $& `x` ``");
    // The pipe is escaped so it cannot split the table cell.
    expect(md).toContain("| Print Name | ` A \\| B ` |  |");
  });

  it("never lets a typed value capture a later template placeholder", () => {
    const md = fillCoverPage(
      coverTemplate,
      formData({
        purpose: "See [Fill in state] and [Today’s date]",
        governingLaw: "Delaware",
      }),
    );
    expect(md).toContain("` See [Fill in state] and [Today’s date] `");
    expect(md).toContain("Governing Law: ` Delaware `");
    expect(md).toContain("` November 5, 2026 `");
  });

  it("renders multi-line purpose and modifications as hard-broken lines", () => {
    const md = fillCoverPage(
      coverTemplate,
      formData({ modifications: "Clause 3 is removed.\n\nClause 4 applies." }),
    );
    expect(md).toContain("` Clause 3 is removed. `\\\n` Clause 4 applies. `");
  });
});

describe("prepareStandardTerms", () => {
  it("turns cover page links into bold defined terms", () => {
    const md = prepareStandardTerms(termsTemplate);
    expect(md).not.toContain("<span");
    expect(md).toContain("solely for the **Purpose**");
  });
});

describe("documentTitle", () => {
  it("includes both company names in a filename-safe form", () => {
    expect(documentTitle(formData())).toBe("Mutual-NDA-Acme-Inc-Globex-Corp");
  });

  it("skips company names with no usable characters", () => {
    const data = formData();
    data.parties[0] = { ...data.parties[0], company: "&&&" };
    expect(documentTitle(data)).toBe("Mutual-NDA-Globex-Corp");
  });

  it("falls back to a generic title", () => {
    expect(documentTitle(createDefaultFormData("2026-11-05"))).toBe("Mutual-NDA");
  });
});
