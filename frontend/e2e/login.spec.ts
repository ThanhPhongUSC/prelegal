import { test, expect } from "@playwright/test";

// The e2e server serves the static export with no backend, so we only assert the
// auth screen renders and toggles. The submit path is covered by unit tests.
test.describe("Auth", () => {
  test("shows the sign-in screen at the root", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Prelegal" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("can switch to the sign-up form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Create one" }).click();
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });
});
