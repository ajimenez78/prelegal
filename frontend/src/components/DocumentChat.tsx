"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { ChatContext, ChatReply, Message } from "@/lib/chat";

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a legal agreement. What kind of document do you need?",
};

interface DocumentChatProps {
  context: ChatContext;
  /** A saved conversation to continue. A new chat starts with a greeting. */
  initialMessages?: Message[];
  /** Receives each reply and the conversation including it. Awaited, so the
   * user cannot send again until it settles (e.g. while the draft saves). */
  onReply: (reply: ChatReply, messages: Message[]) => void | Promise<void>;
}

/** Freeform AI chat that finds the right document and fills in its fields. */
export function DocumentChat({ context, initialMessages, onReply }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? [GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const log = logRef.current!;
    log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const history = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(history);
    setInput("");
    setPending(true);
    setError("");
    try {
      const response = await api("/chat", "POST", { messages: history, ...context });
      if (!response.ok) throw new Error(`Chat failed: ${response.status}`);
      const reply: ChatReply = await response.json();
      const next = [...history, { role: "assistant" as const, content: reply.reply }];
      setMessages(next);
      await onReply(reply, next);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="chat">
      <ol className="chat-log" ref={logRef} aria-live="polite">
        {messages.map((message, index) => (
          <li key={index} className={`chat-message chat-message-${message.role}`}>
            {message.content}
          </li>
        ))}
        {pending && <li className="chat-message chat-message-pending">Thinking...</li>}
      </ol>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          aria-label="Message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your answer..."
          autoComplete="off"
        />
        <button type="submit" className="primary-button" disabled={pending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
