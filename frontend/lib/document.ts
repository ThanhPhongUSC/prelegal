/**
 * Supported document types and the in-progress document draft.
 *
 * A draft is the chosen document type plus the cover-page fields gathered from
 * the chat. The Standard Terms come verbatim from the backend template, never
 * from the model.
 */

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
