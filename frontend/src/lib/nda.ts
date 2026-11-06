/**
 * Pure logic for turning the Common Paper Mutual NDA templates into a
 * completed document. Kept free of React and Node APIs so it can be unit
 * tested and used on both server and client.
 *
 * Filled-in values are emitted as markdown inline code spans. The document
 * renderer maps inline code to a styled "filled field" element; the
 * templates themselves contain no inline code, so the mapping is unambiguous.
 */

export interface Party {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export interface NdaFormData {
  purpose: string;
  /** ISO date (YYYY-MM-DD). */
  effectiveDate: string;
  mndaTerm: "expires" | "untilTerminated";
  mndaTermYears: number;
  confidentialityTerm: "years" | "perpetual";
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  parties: [Party, Party];
}

/** Placeholder text exactly as it appears in Mutual-NDA-coverpage.md. */
const DEFAULT_PURPOSE =
  "Evaluating whether to enter into a business relationship with the other party.";
const PLACEHOLDERS = {
  purpose: `[${DEFAULT_PURPOSE}]`,
  effectiveDate: "[Today’s date]",
  governingLaw: "[Fill in state]",
  jurisdiction:
    "[Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
  modifications: "List any modifications to the MNDA",
} as const;

/** Checkbox option text as it appears in the template (after the box). */
const OPTIONS = {
  expires: "Expires [1 year(s)] from Effective Date.",
  untilTerminated:
    "Continues until terminated in accordance with the terms of the MNDA.",
  confidentialityYears:
    "[1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
  perpetual: "In perpetuity.",
} as const;

const emptyParty = (): Party => ({
  name: "",
  title: "",
  company: "",
  noticeAddress: "",
});

export function createDefaultFormData(effectiveDate: string): NdaFormData {
  return {
    purpose: DEFAULT_PURPOSE,
    effectiveDate,
    mndaTerm: "expires",
    mndaTermYears: 1,
    confidentialityTerm: "years",
    confidentialityYears: 1,
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    parties: [emptyParty(), emptyParty()],
  };
}

export const yearsUnit = (years: number) => (years === 1 ? "year" : "years");

export function formatYears(years: number): string {
  return `${years} ${yearsUnit(years)}`;
}

/** Format an ISO date as e.g. "November 5, 2026" without timezone drift. */
export function formatDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const [, y, m, d] = match.map(Number);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** A single-line value as an inline code span (rendered as a filled field). */
function field(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  // Fence with more backticks than the longest run inside the value.
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((r) => r.length));
  const fence = "`".repeat(longestRun + 1);
  return `${fence} ${text} ${fence}`;
}

/** A multi-line value: one filled field per line, joined by hard breaks. */
function multilineField(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(field)
    .join("\\\n");
}

/** A value inside a GFM table cell, where `|` would split the cell. */
export function tableField(value: string): string {
  return value.trim() ? field(value).replace(/\|/g, "\\|") : "";
}

/** Use the value if provided, otherwise keep the template's placeholder. */
function orPlaceholder(value: string, placeholder: string, render = field) {
  return value.trim() ? render(value) : placeholder;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Matches a whole task-list line in the template, whatever its box state. */
const checkboxLine = (optionText: string) =>
  new RegExp(`^- \\[[ x]\\]\\s+${escapeRegExp(optionText)}$`, "m");

const checkbox = (checked: boolean, text: string) =>
  `- [${checked ? "x" : " "}] ${text}`;

/** Convert the templates' inline HTML into plain markdown emphasis. */
function htmlToMarkdown(template: string): string {
  return template
    .replace(/<label>(.*?)<\/label>/g, "_$1_")
    .replace(/<span[^>]*>(.*?)<\/span>/g, "**$1**");
}

/** Signature block for two parties, headed by their labels. */
export function signatureTable(
  [p1, p2]: [Party, Party],
  [label1, label2] = ["PARTY 1", "PARTY 2"],
): string {
  const row = (label: string, a = "", b = "") => `| ${label} | ${a} | ${b} |`;
  const partyRow = (label: string, key: keyof Party) =>
    row(label, tableField(p1[key]), tableField(p2[key]));
  return [
    `| | ${label1} | ${label2} |`,
    "|:--- | :----: | :----: |",
    row("Signature"),
    partyRow("Print Name", "name"),
    partyRow("Title", "title"),
    partyRow("Company", "company"),
    partyRow("Notice Address", "noticeAddress"),
    row("Date"),
    "",
  ].join("\n");
}

/** What to look for in the cover page template, and what replaces it. */
function coverPageReplacements(data: NdaFormData): [string | RegExp, string][] {
  const years = (n: number) => field(formatYears(n));
  return [
    [
      PLACEHOLDERS.purpose,
      orPlaceholder(data.purpose, PLACEHOLDERS.purpose, multilineField),
    ],
    [
      PLACEHOLDERS.effectiveDate,
      orPlaceholder(formatDate(data.effectiveDate), PLACEHOLDERS.effectiveDate),
    ],
    [
      checkboxLine(OPTIONS.expires),
      checkbox(
        data.mndaTerm === "expires",
        `Expires ${years(data.mndaTermYears)} from Effective Date.`,
      ),
    ],
    [
      checkboxLine(OPTIONS.untilTerminated),
      checkbox(data.mndaTerm === "untilTerminated", OPTIONS.untilTerminated),
    ],
    [
      checkboxLine(OPTIONS.confidentialityYears),
      checkbox(
        data.confidentialityTerm === "years",
        OPTIONS.confidentialityYears.replace(
          "[1 year(s)]",
          years(data.confidentialityYears),
        ),
      ),
    ],
    [
      checkboxLine(OPTIONS.perpetual),
      checkbox(data.confidentialityTerm === "perpetual", OPTIONS.perpetual),
    ],
    [
      PLACEHOLDERS.governingLaw,
      orPlaceholder(data.governingLaw, PLACEHOLDERS.governingLaw),
    ],
    [
      PLACEHOLDERS.jurisdiction,
      orPlaceholder(data.jurisdiction, PLACEHOLDERS.jurisdiction),
    ],
    [
      PLACEHOLDERS.modifications,
      `_${PLACEHOLDERS.modifications}_\n\n${orPlaceholder(
        data.modifications,
        "None.",
        multilineField,
      )}`,
    ],
    [/^\|\| PARTY 1 \| PARTY 2 \|\n(?:\|.*\|\n?)+/m, signatureTable(data.parties)],
  ];
}

/** Fill the Mutual NDA cover page template with the form data. */
export function fillCoverPage(template: string, data: NdaFormData): string {
  const replacements = coverPageReplacements(data);

  // Phase 1: swap each placeholder for a token, failing loudly if the
  // template no longer contains it. No user input is in the text yet, so a
  // value can never be mistaken for a later placeholder.
  let md = htmlToMarkdown(template);
  replacements.forEach(([search], i) => {
    const found =
      typeof search === "string" ? md.includes(search) : search.test(md);
    if (!found) {
      throw new Error(`NDA template placeholder not found: ${String(search)}`);
    }
    md = md.replace(search, `\u0000${i}\u0000`);
  });

  // Phase 2: fill all tokens in a single pass. Inserted values are not
  // rescanned, and a function replacement keeps `$` in input literal.
  return md.replace(/\u0000(\d+)\u0000/g, (_, i) => replacements[Number(i)][1]);
}

/** Prepare the standard terms template for rendering (no form data needed). */
export function prepareStandardTerms(template: string): string {
  return htmlToMarkdown(template);
}

/** A filename-friendly document title, used for the saved PDF. */
export function documentTitle(data: NdaFormData): string {
  return fileTitle("Mutual NDA", data.parties.map((p) => p.company));
}

/** Join a base name and company names into a filename-friendly title. */
export function fileTitle(base: string, companies: string[]): string {
  const slug = (text: string) => text.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return [base, ...companies].map(slug).filter(Boolean).join("-");
}
