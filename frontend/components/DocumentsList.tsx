"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import {
  fetchCatalog,
  fetchDocuments,
  type CatalogEntry,
  type SavedDocumentSummary,
} from "@/lib/document";

/**
 * "My Documents" page: lists the signed-in user's saved drafts, newest first.
 * Clicking one reopens it in the creator.
 */
export default function DocumentsList() {
  const router = useRouter();
  const [docs, setDocs] = useState<SavedDocumentSummary[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDocuments()
      .then(setDocs)
      .catch(() => setError(true));
    fetchCatalog()
      .then((entries: CatalogEntry[]) =>
        setNames(Object.fromEntries(entries.map((e) => [e.id, e.name]))),
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <TopBar active="documents" />

      <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-heading">My Documents</h1>
              <p className="text-sm text-gray-500">
                Drafts you have saved. Open one to keep editing or download it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/creator")}
              className="rounded-md bg-brand-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              New Document
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Could not load your documents.
            </p>
          )}

          {docs && docs.length === 0 && !error && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-gray-600">You have not saved any documents yet.</p>
              <button
                type="button"
                onClick={() => router.push("/creator")}
                className="mt-4 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Draft your first document
              </button>
            </div>
          )}

          {docs && docs.length > 0 && (
            <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/creator?doc=${doc.id}`)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-brand-heading">{doc.title}</p>
                      <p className="text-sm text-gray-500">
                        {names[doc.document_type] ?? doc.document_type}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(doc.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function formatDate(value: string): string {
  // SQLite returns UTC "YYYY-MM-DD HH:MM:SS"; render just the date.
  const date = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
