"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatFields, ChatUpdates } from "@/lib/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'll help you draft a Mutual NDA. Who are the two parties, and what is the agreement for?",
};

interface NdaChatProps {
  fields: ChatFields;
  onUpdates: (updates: ChatUpdates) => void;
}

/** Freeform AI chat that asks about the NDA and fills in its fields. */
export function NdaChat({ fields, onUpdates }: NdaChatProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, fields }),
      });
      if (!response.ok) throw new Error(`Chat failed: ${response.status}`);
      const { reply, updates } = await response.json();
      onUpdates(updates);
      setMessages([...history, { role: "assistant", content: reply }]);
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
