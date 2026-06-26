"use client";

import { useState } from "react";
import DocumentChat from "@/components/DocumentChat";
import DocumentPreview from "@/components/DocumentPreview";
import { emptyDraft, type DocumentDraft } from "@/lib/document";

/**
 * Stateful client shell: owns the document draft and lays out the AI chat
 * alongside a live, editable preview. The chat fills the draft from the
 * conversation; the user can also edit any field in the preview.
 */
export default function DocumentCreator() {
  const [draft, setDraft] = useState<DocumentDraft>(emptyDraft);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Document Creator</h1>
            <p className="text-sm text-gray-500">
              Chat with the assistant to draft your agreement, then download it as a PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700"
          >
            Download PDF
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-2">
        {/* Chat pane — same height as the preview, scrolls independently */}
        <section className="no-print lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:h-[calc(100vh-9rem)]">
            <DocumentChat onDraft={setDraft} />
          </div>
        </section>

        {/* Live, editable preview pane */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="doc-preview overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-10 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
              <DocumentPreview draft={draft} onChange={setDraft} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
