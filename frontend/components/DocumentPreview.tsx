"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { fetchTemplate, type DocumentDraft, type Template } from "@/lib/document";

const editInput =
  "editable-field w-full rounded border border-dashed border-gray-300 bg-white px-2 py-1 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary";

/**
 * Live preview of the document draft: an editable cover page of the collected
 * fields, followed by the Standard Terms rendered verbatim from the template.
 */
export default function DocumentPreview({
  draft,
  onChange,
}: {
  draft: DocumentDraft;
  onChange: (draft: DocumentDraft) => void;
}) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!draft.documentType) {
      setTemplate(null);
      return;
    }
    let active = true;
    setError(false);
    fetchTemplate(draft.documentType)
      .then((t) => active && setTemplate(t))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [draft.documentType]);

  const setField = (index: number, value: string) =>
    onChange({
      ...draft,
      fields: draft.fields.map((f, i) => (i === index ? { ...f, value } : f)),
    });

  if (!draft.documentType && draft.fields.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Your document will appear here once you tell the assistant what you need.
      </p>
    );
  }

  return (
    <article className="doc-body font-serif text-[15px] leading-relaxed text-gray-900">
      <h1 className="mb-6 text-2xl font-bold">{template?.name ?? "Document"}</h1>

      {draft.fields.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Cover Page
          </h2>
          <div className="space-y-3">
            {draft.fields.map((field, i) => (
              <label key={`${field.label}-${i}`} className="block">
                <span className="text-sm font-bold">{field.label}</span>
                <input
                  aria-label={field.label}
                  className={editInput}
                  value={field.value}
                  onChange={(e) => setField(i, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="no-print text-sm text-red-600">Could not load the document terms.</p>
      )}

      {template && (
        <section className="doc-page-break">
          <h2 className="mb-4 text-xl font-bold">Standard Terms</h2>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {template.markdown}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </article>
  );
}
