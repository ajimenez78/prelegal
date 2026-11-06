import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Inline code marks a value the user filled in (see lib/nda.ts and lib/keyterms.ts), so it is
 * rendered as a filled blank rather than as code.
 */
const components: Components = {
  code: ({ children }) => <span className="document-field">{children}</span>,
  // GFM task list checkboxes: drawn as boxes so they print crisply rather
  // than as greyed-out disabled form controls.
  input: ({ checked }) => (
    <span
      className="document-checkbox"
      role="img"
      aria-label={checked ? "Selected" : "Not selected"}
      data-checked={Boolean(checked)}
    />
  ),
};

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}

interface DocumentPreviewProps {
  title: string;
  coverPage: string;
  standardTerms: string;
}

export function DocumentPreview({ title, coverPage, standardTerms }: DocumentPreviewProps) {
  return (
    <article className="document-preview" aria-label={`${title} preview`}>
      <p className="document-disclaimer">
        Draft for review. This document was drafted with Prelegal and is subject to legal
        review before it is signed or relied on.
      </p>
      <section>
        <Markdown>{coverPage}</Markdown>
      </section>
      <section className="document-standard-terms">
        <Markdown>{standardTerms}</Markdown>
      </section>
    </article>
  );
}
