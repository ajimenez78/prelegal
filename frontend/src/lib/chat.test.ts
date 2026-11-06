import { describe, expect, it } from "vitest";
import {
  applyChatUpdates,
  applyReply,
  emptyDraft,
  toChatFields,
  type ChatFields,
  type ChatReply,
  type ChatUpdates,
} from "./chat";
import { createDefaultFormData, type NdaFormData } from "./nda";

function formData(): NdaFormData {
  const data = createDefaultFormData("2026-11-06");
  data.parties[0].company = "Acme Inc";
  data.parties[1].noticeAddress = "1 Main St";
  return data;
}

function noUpdates(): ChatUpdates {
  const keys = Object.keys(toChatFields(formData())) as (keyof ChatFields)[];
  return Object.fromEntries(keys.map((key) => [key, null])) as ChatUpdates;
}

describe("toChatFields", () => {
  it("flattens the parties into party1*/party2* keys", () => {
    const fields = toChatFields(formData());
    expect(fields.party1Company).toBe("Acme Inc");
    expect(fields.party2NoticeAddress).toBe("1 Main St");
    expect(fields.mndaTerm).toBe("expires");
    expect(fields).not.toHaveProperty("parties");
    expect(Object.keys(fields)).toHaveLength(17);
  });
});

describe("applyChatUpdates", () => {
  it("leaves the form unchanged when every update is null", () => {
    expect(applyChatUpdates(formData(), noUpdates())).toEqual(formData());
  });

  it("applies scalar updates", () => {
    const next = applyChatUpdates(formData(), {
      ...noUpdates(),
      governingLaw: "Delaware",
      mndaTerm: "untilTerminated",
      confidentialityYears: 3,
    });
    expect(next.governingLaw).toBe("Delaware");
    expect(next.mndaTerm).toBe("untilTerminated");
    expect(next.confidentialityYears).toBe(3);
  });

  it("updates only the named party field", () => {
    const next = applyChatUpdates(formData(), {
      ...noUpdates(),
      party2Company: "Globex LLC",
      party1NoticeAddress: "9 Elm St",
    });
    expect(next.parties[0]).toEqual({
      name: "",
      title: "",
      company: "Acme Inc",
      noticeAddress: "9 Elm St",
    });
    expect(next.parties[1].company).toBe("Globex LLC");
    expect(next.parties[1].noticeAddress).toBe("1 Main St");
  });

  it("applies an empty string, which clears a field", () => {
    const next = applyChatUpdates(formData(), { ...noUpdates(), party1Company: "" });
    expect(next.parties[0].company).toBe("");
  });

  it("does not mutate the input", () => {
    const data = formData();
    applyChatUpdates(data, { ...noUpdates(), party1Company: "Other" });
    expect(data).toEqual(formData());
  });
});

describe("applyReply", () => {
  const reply = (overrides: Partial<ChatReply>): ChatReply => ({
    reply: "ok",
    documentType: null,
    updates: noUpdates(),
    terms: [],
    ...overrides,
  });

  it("starts with no document chosen", () => {
    expect(emptyDraft().documentId).toBeNull();
  });

  it("chooses a document and fills its terms in the same turn", () => {
    const draft = applyReply(
      emptyDraft(),
      reply({ documentType: "CSA", terms: [{ term: "Customer", value: "Globex" }] }),
    );
    expect(draft.documentId).toBe("CSA");
    expect(draft.terms).toEqual({ Customer: "Globex" });
  });

  it("keeps the current document when no document is returned", () => {
    const start = { ...emptyDraft(), documentId: "CSA", terms: { Customer: "Globex" } };
    const draft = applyReply(start, reply({ terms: [{ term: "Provider", value: "Acme" }] }));
    expect(draft.documentId).toBe("CSA");
    expect(draft.terms).toEqual({ Customer: "Globex", Provider: "Acme" });
  });

  it("starts the new document empty when switching", () => {
    const start = { ...emptyDraft(), documentId: "CSA", terms: { Customer: "Globex" } };
    const draft = applyReply(start, reply({ documentType: "Mutual-NDA" }));
    expect(draft.documentId).toBe("Mutual-NDA");
    expect(draft.terms).toEqual({});
  });

  it("applies NDA updates", () => {
    const draft = applyReply(
      { ...emptyDraft(), documentId: "Mutual-NDA" },
      reply({ updates: { ...noUpdates(), governingLaw: "Delaware" } }),
    );
    expect(draft.nda.governingLaw).toBe("Delaware");
  });
});
