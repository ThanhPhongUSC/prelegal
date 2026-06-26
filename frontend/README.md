# Document Creator (frontend)

A Next.js web app that lets a user draft any supported [Common
Paper](https://commonpaper.com/) legal agreement through a freeform AI chat. The
assistant identifies the document, declines unsupported types and suggests the
closest supported one, then guides the user through the details. The collected
cover-page fields and the Standard Terms render live, and the result downloads
locally as a PDF.

Implements Jira issue **PL-6 — Expand to all supported legal document types**
(builds on the AI chat from PL-5).

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The chat and preview talk to
the backend API, so run the backend too (see `../backend/README.md`).

## How it works

- **`components/DocumentChat.tsx`** — the AI chat; streams the assistant's reply
  and reports the extracted document draft.
- **`components/DocumentPreview.tsx`** — editable cover-page fields plus the
  Standard Terms rendered verbatim from the selected template (Markdown).
- **`lib/document.ts`** — `DocumentDraft`/`CatalogEntry` types and the
  `fetchCatalog` / `fetchTemplate` API helpers.
- **`lib/chat.ts`** — streams `/api/chat` Server-Sent Events.
- **Download** — the "Download PDF" button calls `window.print()`; a print
  stylesheet in `app/globals.css` hides the app chrome so only the agreement is
  printed. Choose "Save as PDF" in the browser's print dialog.

## Attribution

Document text is from the Common Paper standards, free to use under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
