// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toChatFields } from "../lib/chat";
import { createDefaultFormData } from "../lib/nda";
import { NdaChat } from "./NdaChat";

const fields = toChatFields(createDefaultFormData("2026-11-06"));
const onUpdates = vi.fn();

function send(text: string) {
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

function replyWith(body: object, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("NdaChat", () => {
  beforeEach(() => render(<NdaChat fields={fields} onUpdates={onUpdates} />));

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    onUpdates.mockReset();
  });

  it("opens with a greeting", () => {
    expect(screen.getByText(/help you draft a Mutual NDA/)).toBeTruthy();
  });

  it("posts the conversation and fields, then shows the reply and applies updates", async () => {
    const updates = { governingLaw: "Delaware" };
    const fetchMock = replyWith({ reply: "Which courts?", updates });

    send("Delaware law");

    expect(await screen.findByText("Which courts?")).toBeTruthy();
    expect(screen.getByText("Delaware law")).toBeTruthy();
    expect(onUpdates).toHaveBeenCalledWith(updates);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.fields).toEqual(fields);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe("assistant");
    expect(body.messages[1]).toEqual({ role: "user", content: "Delaware law" });
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
    expect(onUpdates).not.toHaveBeenCalled();
  });

  it("shows an error when the reply is not valid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 200 })));
    send("Hello");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onUpdates).not.toHaveBeenCalled();
  });

  it("shows an error when the request cannot be sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    send("Hello");
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
