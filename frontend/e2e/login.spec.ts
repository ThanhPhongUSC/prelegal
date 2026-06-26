import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("shows the sign-in screen at the root", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Prelegal" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("signing in brings the user into the NDA creator", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/creator/);
    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();
  });
});
