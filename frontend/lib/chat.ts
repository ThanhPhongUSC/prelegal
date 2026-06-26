/**
 * Client for the streaming chat endpoint (`POST /api/chat`).
 *
 * The backend replies with Server-Sent Events: `delta` chunks of reply text,
 * one `fields` event carrying the full extracted NDA data, then `done`.
 */

import type { NdaData } from "@/lib/nda";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onFields: (fields: NdaData) => void;
}

/** Streams one assistant turn, invoking handlers as events arrive. */
export async function streamChat(
  messages: ChatMessage[],
  { onDelta, onFields }: StreamHandlers,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      dispatch(raw, onDelta, onFields);
    }
  }
}

function dispatch(
  raw: string,
  onDelta: (text: string) => void,
  onFields: (fields: NdaData) => void,
): void {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return;

  if (event === "delta") onDelta(JSON.parse(data).text as string);
  else if (event === "fields") onFields(JSON.parse(data) as NdaData);
}
