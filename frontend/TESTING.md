# Testing — Mutual NDA Creator

## Automated tests

| Layer | Tool | Location | Run |
| --- | --- | --- | --- |
| Unit (pure logic) | Vitest | `__tests__/nda.test.ts` | `npm test` |
| Component (DOM) | Vitest + Testing Library | `__tests__/*.test.tsx` | `npm test` |
| End-to-end + print/PDF | Playwright (headless Chromium) | `e2e/nda.spec.ts` | `npm run test:e2e` |

```bash
npm test         # 28 unit + component tests (jsdom)
npm run test:e2e # 5 browser tests incl. print-media + PDF generation
```

### What the automated tests cover

- **Formatting helpers** — effective-date formatting (incl. timezone-safe day),
  singular/plural years, open-ended term, perpetual confidentiality, governing
  law / jurisdiction placeholders.
- **Standard Terms integrity** — all 11 sections present and numbered; every
  `{{token}}` has a matching interpolation value; Cover Page defined terms use
  `[[...]]` markers.
- **Document rendering** — Cover Page values, party names, formatted date,
  Section 9 interpolation, placeholder fallbacks, signature table, attribution.
- **Form behavior** — controlled updates, radio toggles disabling the year
  inputs, independent Party 1 / Party 2 fields, and focus retention while typing
  (guards the `PartyFields` remount regression).
- **E2E** — live preview updates as the form changes, print layout hides the app
  chrome, and a completed agreement exports as a non-trivial **multi-page** PDF.

## Manual test checklist

Run `npm run dev` and open http://localhost:3000.

### Form → live preview
- [ ] Editing **Purpose** updates the Cover Page Purpose immediately.
- [ ] Picking an **Effective Date** shows a human-readable date (e.g. "July 2, 2026").
- [ ] Selecting **"Continues until terminated"** disables the MNDA years input and
      the preview reflects the open-ended wording.
- [ ] Selecting **"In perpetuity"** disables the confidentiality years input.
- [ ] Changing year counts updates singular/plural wording ("1 year" vs "2 years").
- [ ] **Governing Law** / **Jurisdiction** appear on the Cover Page and inside
      Section 9 ("laws of the State of …", "courts located in …").
- [ ] Party 1 and Party 2 fields populate their own column in the signature table
      and never overwrite each other.
- [ ] Leaving fields blank shows sensible placeholders (`[State]`, `None.`, etc.).

### Download / PDF
- [ ] Click **Download PDF** → the browser print dialog opens.
- [ ] In the print preview, the form and header are **hidden**; only the agreement shows.
- [ ] The **Standard Terms start on a new page** after the Cover Page.
- [ ] Numbered clauses are not awkwardly split across a page boundary.
- [ ] "Save as PDF" produces a readable, selectable (not image-only) document.

### Layout / responsiveness
- [ ] On a wide screen, form and preview sit side by side; the preview is sticky.
- [ ] On a narrow screen, the panes stack and the preview scrolls.
- [ ] No console errors on load (note: a Grammarly-style extension may still log a
      benign hydration message — handled via `suppressHydrationWarning`).

### Cross-browser (spot check)
- [ ] Chrome, Firefox, and Safari render the document and print correctly.
