"use client";

import { useEffect, useState } from "react";
import DocumentChat from "@/components/DocumentChat";
import DocumentPreview from "@/components/DocumentPreview";
import SaveDialog from "@/components/SaveDialog";
import TopBar from "@/components/TopBar";
import { emptyDraft, fetchDocument, type DocumentDraft } from "@/lib/document";

/**
 * Stateful client shell: owns the document draft and lays out the AI chat
 * alongside a live, editable preview. The chat fills the draft from the
 * conversation; the user can also edit any field in the preview. A finished
 * draft can be saved to the user's history, and a saved doc reopened via
 * `?doc=<id>`.
 */
export default function DocumentCreator() {
  const [draft, setDraft] = useState<DocumentDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reopen a saved document when arriving with a `?doc=<id>` query param.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("doc");
    if (!id) return;
    fetchDocument(Number(id))
      .then((d) => setDraft({ documentType: d.document_type, fields: d.fields }))
      .catch(() => {});
  }, []);

  const hasDocument = Boolean(draft.documentType) || draft.fields.length > 0;

  const actions = (
    <button
      type="button"
      onClick={() => setSaving(true)}
      disabled={!hasDocument}
      className="rounded-md bg-brand-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );

  return (
    <>
      <TopBar active="creator" actions={actions} />

      <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-brand-heading">
                Document Creator
              </h1>
              <p className="text-sm text-gray-500">
                Chat with the assistant to draft your agreement, then save or
                download it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-6 lg:grid-cols-2">
          {/* Chat pane — same height as the preview, scrolls independently */}
          <section className="no-print lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:h-[calc(100vh-7rem)]">
              <DocumentChat onDraft={setDraft} />
            </div>
          </section>

          {/* Live, editable preview pane */}
          <section className="lg:sticky lg:top-20 lg:self-start">
            <div className="doc-preview overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-10 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                <DocumentPreview draft={draft} onChange={setDraft} />
              </div>
            </div>
          </section>
        </div>
      </main>

      {saving && (
        <SaveDialog
          draft={draft}
          onClose={() => setSaving(false)}
          onSaved={() => {
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        />
      )}
    </>
  );
}
