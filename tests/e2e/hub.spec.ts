import { expect, test } from "@playwright/test";

test("renders the hub and launches Snake", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Dylan Games/);
  await expect(page.getByRole("heading", { name: "Dylan Games", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();
  await expect(page.getByRole("img", { name: /Snake board/i })).toBeVisible();

  await page.getByRole("button", { name: /Play Snake/i }).click();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();
});

test("switches to a placeholder game with a finished unavailable state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Minesweeper/i }).click();

  await expect(page).toHaveURL(/\/games\/minesweeper$/);
  await expect(page.getByRole("heading", { name: "Minesweeper", level: 2 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Minesweeper is not playable yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play Snake" }).click();
  await expect(page).toHaveURL(/\/games\/snake$/);
});

test("keeps soft-launch robots metadata", async ({ page }) => {
  await page.goto("/");

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
});
