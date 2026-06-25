"use client";

import { useState } from "react";
import NdaForm from "@/components/NdaForm";
import NdaDocument from "@/components/NdaDocument";
import { defaultNdaData, type NdaData } from "@/lib/nda";

/**
 * Stateful client shell: owns the form data and lays out the form alongside a
 * live preview of the rendered agreement. Kept separate from the route so
 * `app/page.tsx` can remain a Server Component.
 */
export default function NdaCreator() {
  const [data, setData] = useState<NdaData>(defaultNdaData);

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mutual NDA Creator</h1>
            <p className="text-sm text-gray-500">
              Fill in the details and download a completed Mutual Non-Disclosure Agreement.
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
        {/* Form pane — same height as the preview, scrolls independently */}
        <section className="no-print lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
            <NdaForm data={data} onChange={setData} />
          </div>
        </section>

        {/* Live preview pane — same height as the form, scrolls independently */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="nda-preview overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-10 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
              <NdaDocument data={data} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
