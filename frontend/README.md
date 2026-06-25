# Mutual NDA Creator (frontend)

A Next.js web app that lets a user create a [Common Paper Mutual Non-Disclosure
Agreement](https://commonpaper.com/standards/mutual-nda/1.0/). The user fills in
the key details (purpose, term, governing law, party information), sees the
completed agreement render live, and downloads it locally as a PDF.

Implements Jira issue **PL-3 — Prototype of Mutual NDA creator**.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- **`components/NdaForm.tsx`** — controlled form capturing the full Cover Page.
- **`components/NdaDocument.tsx`** — renders the Cover Page and Standard Terms
  with the user's values filled in.
- **`lib/nda.ts`** — the `NdaData` type, defaults, formatting helpers, and the
  Standard Terms text (sourced from `../templates/Mutual-NDA.md`).
- **Download** — the "Download PDF" button calls `window.print()`; a print
  stylesheet in `app/globals.css` hides the app chrome so only the agreement is
  printed. Choose "Save as PDF" in the browser's print dialog.

## Attribution

The agreement text is the Common Paper Mutual NDA, Version 1.0, free to use
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
