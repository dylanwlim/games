import { expect, test } from "@playwright/test";

test("renders the hub and launches Snake", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Dylan Games/);
  await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeHidden();
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Favorites" })).toBeVisible();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeHidden();
  }
  await expect(page.getByRole("heading", { name: "Top Arcade Games" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recently Updated" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();

  await page.getByRole("link", { name: "Get Snake from Top Arcade Games" }).click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();
  await expect(page.getByRole("img", { name: /Snake board/i })).toBeVisible();

  await page.getByRole("button", { name: /Play Snake/i }).click();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();
});

test("switches to a placeholder game with a finished unavailable state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get Minesweeper from Top Arcade Games" }).click();

  await expect(page.getByRole("heading", { name: "Minesweeper", level: 2 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Minesweeper is not playable yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play Snake" }).click();
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();
});

test("renders discover and genre pages", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "Discover", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Every sidebar page has a surface." }),
  ).toBeVisible();

  await page.goto("/games/favorites");
  await expect(page.getByRole("heading", { name: "Favorites", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Favorite-ready games" })).toBeVisible();

  await page.goto("/genres/puzzle");
  await expect(page.getByRole("heading", { name: "Puzzle", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Puzzle games" })).toBeVisible();
});

test("keeps soft-launch robots metadata", async ({ page }) => {
  await page.goto("/");

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
});
