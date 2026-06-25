import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test.describe("Mutual NDA Creator", () => {
  test("renders the form and a live preview", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Mutual NDA Creator" })).toBeVisible();
    // The preview already shows the document title and Standard Terms.
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Standard Terms", exact: true })).toBeVisible();
  });

  test("typing in the form updates the live preview", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Governing Law (State)").fill("Delaware");
    await page.getByLabel("Jurisdiction (city/county and state)").fill("New Castle County, Delaware");
    await page.getByLabel("Company").first().fill("Acme Inc");
    await page.getByLabel("Company").nth(1).fill("Globex LLC");

    const preview = page.locator(".nda-document");
    await expect(preview.getByText("Acme Inc")).toBeVisible();
    await expect(preview.getByText("Globex LLC")).toBeVisible();
    // Governing law shows on the Cover Page...
    await expect(preview.getByText(/Governing Law:\s*Delaware/)).toBeVisible();
    // ...and is interpolated once into Section 9 (the only exact "Delaware" node).
    await expect(preview.getByText("Delaware", { exact: true })).toHaveCount(1);
    await expect(preview.getByText(/laws of the State of/)).toBeVisible();
  });

  test("switching the term to open-ended disables the years input and updates the doc", async ({
    page,
  }) => {
    await page.goto("/");
    const years = page.getByRole("spinbutton").first();
    await expect(years).toBeEnabled();

    await page.getByText("Continues until terminated under the terms of the MNDA").click();

    await expect(years).toBeDisabled();
    await expect(
      page.locator(".nda-document").getByText(/Continues until terminated/),
    ).toBeVisible();
  });

  test("print layout hides the app chrome (form + header button)", async ({ page }) => {
    await page.goto("/");
    const downloadButton = page.getByRole("button", { name: "Download PDF" });
    await expect(downloadButton).toBeVisible();

    await page.emulateMedia({ media: "print" });

    // .no-print elements are hidden by the print stylesheet; the document stays.
    await expect(downloadButton).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeVisible();
  });

  test("generates a non-trivial, multi-page PDF of the completed agreement", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Governing Law (State)").fill("Delaware");
    await page.getByLabel("Company").first().fill("Acme Inc");

    const outPath = path.join(os.tmpdir(), `mnda-e2e-${Date.now()}.pdf`);
    await page.pdf({ path: outPath, format: "Letter", printBackground: true });

    const bytes = fs.statSync(outPath).size;
    expect(bytes).toBeGreaterThan(10_000); // a real multi-clause document, not a blank page

    // Cheap page-count check: count "/Type /Page" objects in the PDF.
    const raw = fs.readFileSync(outPath, "latin1");
    const pageCount = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pageCount).toBeGreaterThanOrEqual(2); // Cover Page + Standard Terms break

    fs.unlinkSync(outPath);
  });
});
