"use client";

import { useState } from "react";
import { saveDocument, type DocumentDraft } from "@/lib/document";

/**
 * Small modal to name and save the current draft to the user's history.
 * Pre-fills a sensible title from the draft's first field.
 */
export default function SaveDialog({
  draft,
  onClose,
  onSaved,
}: {
  draft: DocumentDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const suggested = draft.fields[0]?.value?.trim() || draft.documentType || "Untitled document";
  const [title, setTitle] = useState(suggested);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveDocument(title.trim() || suggested, draft);
      onSaved();
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-brand-heading">Save document</h2>
        <p className="mt-1 text-sm text-brand-body">
          Give this draft a name so you can find it later.
        </p>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <input
            aria-label="Document name"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
