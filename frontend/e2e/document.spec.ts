import { test, expect } from "@playwright/test";

// These checks avoid the live LLM: they cover the page shell, the chat greeting,
// the empty-state preview, and the print stylesheet — all deterministic.
test.describe("Document Creator", () => {
  test("renders the chat and the empty-state preview", async ({ page }) => {
    await page.goto("/creator/");
    await expect(page.getByRole("heading", { name: "Document Creator" })).toBeVisible();
    await expect(page.getByText(/help you draft a legal agreement/i)).toBeVisible();
    await expect(page.getByText(/your document will appear here/i)).toBeVisible();
    await expect(page.getByPlaceholder("Type your answer...")).toBeVisible();
  });

  test("print layout hides the app chrome", async ({ page }) => {
    await page.goto("/creator/");
    const downloadButton = page.getByRole("button", { name: "Download PDF" });
    await expect(downloadButton).toBeVisible();

    await page.emulateMedia({ media: "print" });

    // .no-print elements (header + chat) are hidden by the print stylesheet.
    await expect(downloadButton).toBeHidden();
  });
});
