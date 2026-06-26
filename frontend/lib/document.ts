/**
 * Supported document types and the in-progress document draft.
 *
 * A draft is the chosen document type plus the cover-page fields gathered from
 * the chat. The Standard Terms come verbatim from the backend template, never
 * from the model.
 */

import { authHeader } from "@/lib/auth";

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
}

export interface CoverField {
  label: string;
  value: string;
}

export interface DocumentDraft {
  documentType: string; // a CatalogEntry id, or "" before one is chosen
  fields: CoverField[];
}

export interface Template {
  id: string;
  name: string;
  markdown: string;
}

/** A saved document as listed in the user's history. */
export interface SavedDocumentSummary {
  id: number;
  document_type: string;
  title: string;
  created_at: string;
}

/** A saved document with its full cover-page fields. */
export interface SavedDocument extends SavedDocumentSummary {
  fields: CoverField[];
}

export const emptyDraft: DocumentDraft = { documentType: "", fields: [] };

/** The document types the assistant can draft. */
export async function fetchCatalog(): Promise<CatalogEntry[]> {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error("Failed to load catalog");
  return res.json();
}

/** The Standard Terms markdown for a document type. */
export async function fetchTemplate(id: string): Promise<Template> {
  const res = await fetch(`/api/template/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load template");
  return res.json();
}

/** Save the current draft to the signed-in user's history. */
export async function saveDocument(
  title: string,
  draft: DocumentDraft,
): Promise<SavedDocumentSummary> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      documentType: draft.documentType,
      title,
      fields: draft.fields,
    }),
  });
  if (!res.ok) throw new Error("Failed to save document");
  return res.json();
}

/** The signed-in user's saved documents, newest first. */
export async function fetchDocuments(): Promise<SavedDocumentSummary[]> {
  const res = await fetch("/api/documents", { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

/** One saved document, with its full cover-page fields. */
export async function fetchDocument(id: number): Promise<SavedDocument> {
  const res = await fetch(`/api/documents/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error("Failed to load document");
  return res.json();
}
