"use client";

import { useEffect, useRef, useState } from "react";
import { streamChat, type ChatMessage } from "@/lib/chat";
import type { DocumentDraft } from "@/lib/document";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you draft a legal agreement. What kind of document do you " +
    "need? If it's one we support, I'll guide you through it and fill in the " +
    "preview on the right as we go.",
};

/**
 * Freeform chat that drives the document draft. Each user turn streams the
 * assistant's reply and reports the extracted draft up via `onDraft`.
 */
export default function DocumentChat({
  onDraft,
}: {
  onDraft: (draft: DocumentDraft) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const sent = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages([...sent, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      await streamChat(sent, {
        onDelta: (chunk) =>
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: next[next.length - 1].content + chunk,
            };
            return next;
          }),
        onDraft,
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong reaching the assistant. Please try again.",
        };
        return next;
      });
    } finally {
      setStreaming(false);
      // Return focus to the input so the user can keep answering uninterrupted.
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-1">
        {messages.map((m, i) => (
          <Bubble key={i} message={m} pending={streaming && i === messages.length - 1} />
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-md bg-brand-secondary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, pending }: { message: ChatMessage; pending: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.content || (pending ? "..." : "")}
      </div>
    </div>
  );
}
