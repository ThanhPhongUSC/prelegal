import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaChat from "@/components/NdaChat";
import { defaultNdaData } from "@/lib/nda";
import type { StreamHandlers } from "@/lib/chat";

const { streamChat } = vi.hoisted(() => ({ streamChat: vi.fn() }));
vi.mock("@/lib/chat", () => ({ streamChat }));

async function send(text: string) {
  await userEvent.type(screen.getByPlaceholderText(/type your answer/i), text);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));
}

describe("NdaChat", () => {
  // Block body: mockReset() returns the spy, and a hook's return value is run as
  // a teardown callback — returning it would invoke streamChat with no args.
  beforeEach(() => {
    streamChat.mockReset();
  });

  it("shows an opening assistant message", () => {
    render(<NdaChat onFields={vi.fn()} />);
    expect(screen.getByText(/help you draft a Mutual NDA/i)).toBeInTheDocument();
  });

  it("sends a message, streams the reply, and reports extracted fields", async () => {
    streamChat.mockImplementation(async (_messages, handlers: StreamHandlers) => {
      handlers.onDelta("Got ");
      handlers.onDelta("it!");
      handlers.onFields({ ...defaultNdaData, purpose: "Evaluate partnership" });
    });
    const onFields = vi.fn();
    render(<NdaChat onFields={onFields} />);

    await send("A mutual NDA");

    expect(screen.getByText("A mutual NDA")).toBeInTheDocument();
    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(onFields).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "Evaluate partnership" }),
    );
  });

  it("shows an error message when streaming fails", async () => {
    streamChat.mockImplementation(async () => {
      throw new Error("network");
    });
    render(<NdaChat onFields={vi.fn()} />);

    await send("hello");

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
