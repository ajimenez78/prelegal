import type { Draft, Message } from "./chat";

/** Calls the backend API. The session cookie is sent automatically (same origin). */
export function api(path: string, method = "GET", body?: unknown): Promise<Response> {
  return fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A saved document as listed on the documents page. */
export interface SavedSummary {
  id: number;
  documentType: string;
  title: string;
  /** ISO 8601, UTC. */
  updatedAt: string;
}

/** A saved document with everything needed to reopen it. */
export interface SavedDocument extends SavedSummary {
  draft: Draft;
  messages: Message[];
}
