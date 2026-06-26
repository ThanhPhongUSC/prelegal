import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentChat from "@/components/DocumentChat";
import type { StreamHandlers } from "@/lib/chat";

const { streamChat } = vi.hoisted(() => ({ streamChat: vi.fn() }));
vi.mock("@/lib/chat", () => ({ streamChat }));

async function send(text: string) {
  await userEvent.type(screen.getByPlaceholderText(/type your answer/i), text);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));
}

describe("DocumentChat", () => {
  // Block body: mockReset() returns the spy, and a hook's return value is run as
  // a teardown callback — returning it would invoke streamChat with no args.
  beforeEach(() => {
    streamChat.mockReset();
  });

  it("shows an opening assistant message", () => {
    render(<DocumentChat onDraft={vi.fn()} />);
    expect(screen.getByText(/help you draft a legal agreement/i)).toBeInTheDocument();
  });

  it("streams the reply, reports the draft, and refocuses the input", async () => {
    streamChat.mockImplementation(async (_messages, handlers: StreamHandlers) => {
      handlers.onDelta("Sure! ");
      handlers.onDelta("Let's start.");
      handlers.onDraft({
        documentType: "CSA",
        fields: [{ label: "Provider", value: "Acme Inc" }],
      });
    });
    const onDraft = vi.fn();
    render(<DocumentChat onDraft={onDraft} />);

    await send("I need a cloud service agreement");

    expect(await screen.findByText("Sure! Let's start.")).toBeInTheDocument();
    expect(onDraft).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: "CSA" }),
    );
    // Enhancement: focus returns to the input after answering.
    expect(document.activeElement).toBe(screen.getByPlaceholderText(/type your answer/i));
  });

  it("shows an error message when streaming fails", async () => {
    streamChat.mockImplementation(async () => {
      throw new Error("network");
    });
    render(<DocumentChat onDraft={vi.fn()} />);

    await send("hello");

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
