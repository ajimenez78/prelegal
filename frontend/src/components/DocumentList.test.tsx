// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentList } from "./DocumentList";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const names = { CSA: "Cloud Service Agreement" };

/** Fake backend: answers each path with the given status and body. */
function serve(routes: Record<string, [number, unknown]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const [status, body] = routes[url];
      return new Response(JSON.stringify(body), { status });
    }),
  );
}

describe("DocumentList", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    replace.mockReset();
  });

  it("lists the user's documents with links to reopen them", async () => {
    serve({
      "/api/me": [200, { email: "ada@example.com" }],
      "/api/documents": [
        200,
        [{ id: 7, documentType: "CSA", title: "Acme CSA", updatedAt: "2026-11-06T10:00:00.000Z" }],
      ],
    });
    render(<DocumentList names={names} />);

    const link = await screen.findByRole("link", { name: /Acme CSA/ });
    // Next adds the trailing slash only when trailingSlash is configured (builds).
    expect(link.getAttribute("href")).toMatch(/^\/draft\/?\?id=7$/);
    expect(link.textContent).toContain("Cloud Service Agreement");
    expect(screen.getByText("ada@example.com")).toBeTruthy();
  });

  it("invites the user to draft a first document when there are none", async () => {
    serve({ "/api/me": [200, { email: "ada@example.com" }], "/api/documents": [200, []] });
    render(<DocumentList names={names} />);

    expect(await screen.findByText("No documents yet")).toBeTruthy();
  });

  it("sends visitors without a session to sign in", async () => {
    serve({ "/api/me": [401, { detail: "Not signed in" }] });
    render(<DocumentList names={names} />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
