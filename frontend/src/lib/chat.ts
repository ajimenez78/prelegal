/**
 * Mapping between the NDA form state and the flat field shape exchanged with
 * the AI chat endpoint. Parties are flattened into party1 and party2 prefixed
 * keys, which structured outputs handle well.
 */
import { createDefaultFormData, type NdaFormData, type Party } from "./nda";

type PartyKey = `party${1 | 2}${Capitalize<keyof Party>}`;
export type ChatFields = Omit<NdaFormData, "parties"> & Record<PartyKey, string>;
/** Field changes returned by the AI. Null means unchanged. */
export type ChatUpdates = { [K in keyof ChatFields]: ChatFields[K] | null };

const PARTY_FIELDS: (keyof Party)[] = ["company", "name", "title", "noticeAddress"];

function partyKey(index: 0 | 1, field: keyof Party): PartyKey {
  return `party${index + 1}${field[0].toUpperCase()}${field.slice(1)}` as PartyKey;
}

export function toChatFields(data: NdaFormData): ChatFields {
  const { parties, ...scalars } = data;
  const fields = { ...scalars } as ChatFields;
  for (const index of [0, 1] as const) {
    for (const field of PARTY_FIELDS) {
      fields[partyKey(index, field)] = parties[index][field];
    }
  }
  return fields;
}

function fromChatFields(fields: ChatFields): NdaFormData {
  const party = (index: 0 | 1): Party => ({
    company: fields[partyKey(index, "company")],
    name: fields[partyKey(index, "name")],
    title: fields[partyKey(index, "title")],
    noticeAddress: fields[partyKey(index, "noticeAddress")],
  });
  const scalars = Object.fromEntries(
    Object.entries(fields).filter(([key]) => !/^party[12]/.test(key)),
  );
  return { ...scalars, parties: [party(0), party(1)] } as NdaFormData;
}

export function applyChatUpdates(data: NdaFormData, updates: ChatUpdates): NdaFormData {
  const fields: Record<string, unknown> = toChatFields(data);
  for (const [key, value] of Object.entries(updates)) {
    if (value !== null) fields[key] = value;
  }
  return fromChatFields(fields as ChatFields);
}

/** Everything the builder knows about the document being drafted. */
export interface Draft {
  documentId: string | null;
  nda: NdaFormData;
  terms: Record<string, string>;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface TermUpdate {
  term: string;
  value: string;
}

/** A supported document as the AI sees it: no template text. */
export interface DocumentSummary {
  id: string;
  name: string;
  description: string;
  terms: string[];
}

/** Sent with every chat message, alongside the conversation. */
export interface ChatContext {
  documentType: string | null;
  fields: ChatFields;
  terms: TermUpdate[];
  documents: DocumentSummary[];
}

/** The AI's answer to one chat turn. */
export interface ChatReply {
  reply: string;
  /** Set when the user chooses or changes the document, otherwise null. */
  documentType: string | null;
  updates: ChatUpdates;
  terms: TermUpdate[];
}

export const emptyDraft = (): Draft => ({
  documentId: null,
  nda: createDefaultFormData(""),
  terms: {},
});

/** Apply a reply. Switching documents starts the new document empty. */
export function applyReply(draft: Draft, reply: ChatReply): Draft {
  const switching = reply.documentType !== null && reply.documentType !== draft.documentId;
  const base = switching ? { ...emptyDraft(), documentId: reply.documentType } : draft;
  const terms = { ...base.terms };
  for (const { term, value } of reply.terms) terms[term] = value;
  return { ...base, nda: applyChatUpdates(base.nda, reply.updates), terms };
}
