import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DocumentPreview from "@/components/DocumentPreview";
import type { DocumentDraft } from "@/lib/document";

const { fetchTemplate } = vi.hoisted(() => ({ fetchTemplate: vi.fn() }));
vi.mock("@/lib/document", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/document")>()),
  fetchTemplate,
}));

describe("DocumentPreview", () => {
  beforeEach(() => {
    fetchTemplate.mockReset();
    fetchTemplate.mockResolvedValue({
      id: "CSA",
      name: "Cloud Service Agreement",
      markdown: "## Standard Terms\n\nConfidential Information is protected.",
    });
  });

  it("shows a placeholder before a document is chosen", () => {
    const draft: DocumentDraft = { documentType: "", fields: [] };
    render(<DocumentPreview draft={draft} onChange={vi.fn()} />);
    expect(screen.getByText(/your document will appear here/i)).toBeInTheDocument();
  });

  it("renders editable cover-page fields and reports edits", async () => {
    const draft: DocumentDraft = {
      documentType: "CSA",
      fields: [{ label: "Provider", value: "Acme Inc" }],
    };
    const onChange = vi.fn();
    render(<DocumentPreview draft={draft} onChange={onChange} />);

    const input = screen.getByLabelText("Provider");
    expect(input).toHaveValue("Acme Inc");

    fireEvent.change(input, { target: { value: "Globex LLC" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [{ label: "Provider", value: "Globex LLC" }],
      }),
    );

    // Flush the async template fetch so its state update isn't left dangling.
    await screen.findByText(/Confidential Information is protected/);
  });

  it("renders the Standard Terms markdown fetched for the document type", async () => {
    const draft: DocumentDraft = { documentType: "CSA", fields: [] };
    render(<DocumentPreview draft={draft} onChange={vi.fn()} />);

    expect(await screen.findByText(/Confidential Information is protected/)).toBeInTheDocument();
    expect(fetchTemplate).toHaveBeenCalledWith("CSA");
  });
});
