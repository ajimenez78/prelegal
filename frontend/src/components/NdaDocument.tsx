import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Inline code marks a value the user filled in (see lib/nda.ts), so it is
 * rendered as a filled blank rather than as code.
 */
const components: Components = {
  code: ({ children }) => <span className="nda-field">{children}</span>,
  // GFM task list checkboxes: drawn as boxes so they print crisply rather
  // than as greyed-out disabled form controls.
  input: ({ checked }) => (
    <span
      className="nda-checkbox"
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

interface NdaDocumentProps {
  coverPage: string;
  standardTerms: string;
}

export function NdaDocument({ coverPage, standardTerms }: NdaDocumentProps) {
  return (
    <article className="nda-document" aria-label="Mutual NDA preview">
      <section>
        <Markdown>{coverPage}</Markdown>
      </section>
      <section className="nda-standard-terms">
        <Markdown>{standardTerms}</Markdown>
      </section>
    </article>
  );
}
