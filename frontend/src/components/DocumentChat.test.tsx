// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toChatFields, type ChatContext } from "../lib/chat";
import { createDefaultFormData } from "../lib/nda";
import { DocumentChat } from "./DocumentChat";

const context: ChatContext = {
  documentType: null,
  fields: toChatFields(createDefaultFormData("")),
  terms: [],
  documents: [{ id: "CSA", name: "Cloud Service Agreement", description: "", terms: [] }],
};
const onReply = vi.fn();

function send(text: string) {
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

function replyWith(body: object, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("DocumentChat", () => {
  beforeEach(() => render(<DocumentChat context={context} onReply={onReply} />));

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    onReply.mockReset();
  });

  it("opens with a greeting", () => {
    expect(screen.getByText(/What kind of document do you need/)).toBeTruthy();
  });

  it("posts the conversation and context, then shows the reply and passes it on", async () => {
    const body = { reply: "Which courts?", documentType: "CSA", updates: {}, terms: [] };
    const fetchMock = replyWith(body);

    send("Delaware law");

    expect(await screen.findByText("Which courts?")).toBeTruthy();
    expect(screen.getByText("Delaware law")).toBeTruthy();
    expect(onReply).toHaveBeenCalledWith(body);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject(context);
    expect(sent.messages).toHaveLength(2);
    expect(sent.messages[0].role).toBe("assistant");
    expect(sent.messages[1]).toEqual({ role: "user", content: "Delaware law" });
  });

  it("clears the input and disables Send while waiting", () => {
    replyWith({ reply: "ok", updates: {} });
    send("Hello");
    expect((screen.getByLabelText("Message") as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("button", { name: "Send" })).toHaveProperty("disabled", true);
    expect(screen.getByText("Thinking...")).toBeTruthy();
  });

  it("shows an error when the server fails", async () => {
    replyWith({ detail: "boom" }, 500);
    send("Hello");
    expect((await screen.findByRole("alert")).textContent).toMatch(/went wrong/);
    expect(onReply).not.toHaveBeenCalled();
  });

  it("shows an error when the reply is not valid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 200 })));
    send("Hello");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onReply).not.toHaveBeenCalled();
  });

  it("shows an error when the request cannot be sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    send("Hello");
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
