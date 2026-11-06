// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocumentInfo } from "../lib/documents";
import { createDefaultFormData } from "../lib/nda";
import { DocumentBuilder } from "./DocumentBuilder";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const CSA: DocumentInfo = {
  id: "CSA",
  name: "Cloud Service Agreement",
  description: "SaaS terms.",
  roles: ["Provider", "Customer"],
  terms: ["Provider", "Customer"],
  standardTerms: "Standard terms.",
};

function chatReply(documentType: string | null, terms: { term: string; value: string }[] = []) {
  return { reply: "Noted.", documentType, updates: {}, terms };
}

/** Fake backend: each chat call answers with the next reply; saves echo an id. */
function serve(replies: object[]) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
    const body = url === "/api/chat" ? replies.shift() : { id: 4 };
    return new Response(JSON.stringify(body), { status: url === "/api/documents" ? 201 : 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function saves(fetchMock: ReturnType<typeof serve>) {
  return fetchMock.mock.calls
    .filter(([url]) => url.startsWith("/api/documents"))
    .map(([url, init]) => ({ url, method: init!.method, body: JSON.parse(init!.body as string) }));
}

async function send(text: string) {
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findAllByText("Noted.");
  await vi.waitFor(() => expect(screen.queryByText("Thinking...")).toBeNull());
}

function renderBuilder() {
  render(<DocumentBuilder documents={[CSA]} ndaCoverPage="" email="ada@example.com" />);
}

describe("DocumentBuilder", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the draft disclaimer", () => {
    renderBuilder();
    expect(screen.getByRole("note").textContent).toMatch(/subject to legal review/);
  });

  it("does not save until a document is chosen", async () => {
    const fetchMock = serve([chatReply(null)]);
    renderBuilder();
    await send("Hello");
    expect(saves(fetchMock)).toEqual([]);
  });

  it("creates the document on the first save and updates it afterwards", async () => {
    const fetchMock = serve([
      chatReply("CSA"),
      chatReply(null, [{ term: "Customer", value: "Acme" }]),
    ]);
    renderBuilder();

    await send("A cloud service agreement");
    await send("The customer is Acme");

    const [created, updated] = saves(fetchMock);
    expect(created).toMatchObject({ url: "/api/documents", method: "POST" });
    expect(created.body.documentType).toBe("CSA");
    expect(created.body.messages).toHaveLength(3);
    expect(updated).toMatchObject({ url: "/api/documents/4", method: "PUT" });
    expect(updated.body.draft.terms).toEqual({ Customer: "Acme" });
    expect(created.body.title).toBe("Cloud Service Agreement");
    expect(updated.body.title).toBe("Acme");
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("reopens a saved document with its chat and preview", () => {
    const saved = {
      id: 9,
      documentType: "CSA",
      title: "Cloud Service Agreement",
      updatedAt: "2026-11-06T10:00:00.000Z",
      draft: { documentId: "CSA", nda: createDefaultFormData(""), terms: { Customer: "Globex" } },
      messages: [{ role: "user" as const, content: "Customer is Globex" }],
    };
    render(
      <DocumentBuilder documents={[CSA]} ndaCoverPage="" email="ada@example.com" saved={saved} />,
    );
    expect(screen.getByText("Customer is Globex")).toBeTruthy();
    expect(screen.getByLabelText("Cloud Service Agreement preview").textContent).toContain(
      "Globex",
    );
  });
});
