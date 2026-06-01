import { expect, test } from "@playwright/test";

test("renders the hub and launches the featured Cipherword game", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Dylan Games/);
  await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeHidden();
    await page.locator("#arcade-sidebar").hover();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await page.mouse.move(720, 420);
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeHidden();
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Favorites" })).toBeVisible();
    await page.mouse.move(720, 420);
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await page.mouse.move(720, 420);
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeHidden();
  }
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All Games" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();
  await expect(page.getByText("Game Center")).toHaveCount(0);
  await expect(page.getByText("Get", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Play Cipherword from Featured" }).click();
  await expect(page).toHaveURL(/\/games\/cipherword/);
  await expect(
    page.getByRole("heading", { name: "Daily semantic word puzzle", level: 2 }),
  ).toBeVisible();
  await expect(page.getByLabel("Cipherword board and input")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All Games" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toHaveCount(0);

  await page.getByLabel("Enter a Cipherword guess").fill("code");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.locator(".cipherword-feedback")).toContainText(
    /Different neighborhood|Right broad domain|Close conceptually|Almost there/,
  );
});

test("filters sidebar search by fuzzy game and category names", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const search = page.getByLabel("Search games");
  const sidebar = page.locator("#arcade-sidebar");
  await expect(search).toBeVisible();

  const activeLinkBackground = await page
    .locator("#arcade-sidebar")
    .getByRole("link", { name: "Games", exact: true })
    .evaluate((element) => window.getComputedStyle(element).backgroundColor);
  const searchBackground = await search.evaluate(
    (element) =>
      window.getComputedStyle(element.closest(".sidebar-search") as HTMLElement).backgroundColor,
  );

  expect(activeLinkBackground).toBe("rgba(0, 0, 0, 0)");
  expect(searchBackground).toBe("rgba(0, 0, 0, 0)");

  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await sidebar.getByRole("link", { name: "Favorites", exact: true }).hover();
    const hoveredLinkBackground = await sidebar
      .getByRole("link", { name: "Favorites", exact: true })
      .evaluate((element) => window.getComputedStyle(element).backgroundColor);
    expect(hoveredLinkBackground).toBe("rgba(0, 0, 0, 0)");
  }

  await search.fill("puzl");
  await expect(page.getByRole("heading", { name: "Playable results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In-progress results" })).toBeVisible();
  await expect(
    page.locator(".coming-soon-card.is-disabled", { hasText: "Minesweeper" }),
  ).toBeVisible();
  await expect(page.locator(".store-game-card.is-disabled", { hasText: "Tiles" })).toBeVisible();
  await expect(page.locator(".store-game-card.is-disabled", { hasText: "2048" })).toBeVisible();
  await expect(page.locator('a.coming-soon-card[href="/games/minesweeper"]')).toHaveCount(0);
  await expect(page.locator('a.store-game-card[href="/games/tiles"]')).toHaveCount(0);
  await expect(page.getByText("Snake", { exact: true })).toHaveCount(0);

  await search.fill("snkae");
  await expect(page.locator('a.store-game-card[href="/games/snake"]')).toBeVisible();
  await expect(page.locator(".store-game-card", { hasText: "Minesweeper" })).toHaveCount(0);

  await search.fill("semantic");
  await expect(page.locator('a.store-game-card[href="/games/cipherword"]')).toBeVisible();
});

test("opens Snake from every Snake entry point", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Resume Snake from Continue Playing" }).click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();

  await page.goto("/");
  await page.locator('a.store-game-card[href="/games/snake"]').click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByLabel(/Snake board/i)).toBeVisible();

  await page.goto("/games/favorites");
  await page.locator('a.template-game-card[href="/games/snake"]').click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByLabel(/Snake board/i)).toBeVisible();

  await page.goto("/genres/action");
  await page.locator('a.template-game-card[href="/games/snake"]').click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByLabel(/Snake board/i)).toBeVisible();

  await page.goto("/discover");
  await page.locator('a.template-game-card[href="/games/snake"]').click();
  await expect(page).toHaveURL(/\/games\/snake/);
  await expect(page.getByLabel(/Snake board/i)).toBeVisible();
});

test("opens Cipherword from every Cipherword entry point", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Play Cipherword from Featured" }).click();
  await expect(page).toHaveURL(/\/games\/cipherword/);
  await expect(page.getByLabel("Cipherword board and input")).toBeVisible();

  await page.goto("/");
  await page.locator('a.store-game-card[href="/games/cipherword"]').click();
  await expect(page).toHaveURL(/\/games\/cipherword/);

  await page.goto("/games/favorites");
  await page.locator('a.collection-primary-action[href="/games/cipherword"]').click();
  await expect(page).toHaveURL(/\/games\/cipherword/);

  await page.goto("/games/favorites");
  await page.locator('a.template-game-card[href="/games/cipherword"]').click();
  await expect(page).toHaveURL(/\/games\/cipherword/);

  await page.goto("/genres/word");
  await page.locator('a.template-game-card[href="/games/cipherword"]').click();
  await expect(page).toHaveURL(/\/games\/cipherword/);

  await page.goto("/discover");
  await page.locator('a.template-game-card[href="/games/cipherword"]').click();
  await expect(page).toHaveURL(/\/games\/cipherword/);
});

test("plays Snake with keyboard, modes, restart, and touch swipe", async ({ page }) => {
  await page.goto("/games/snake");

  const board = page.getByLabel(/Snake board/i);
  await expect(board).toBeVisible();
  await expect(page.getByRole("heading", { name: "All Games" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toHaveCount(0);

  const scrollState = await page.evaluate(() => ({
    bodyCanScroll: (document.scrollingElement?.scrollHeight ?? 0) > window.innerHeight + 1,
    mainOverflowY: document.querySelector("main")
      ? window.getComputedStyle(document.querySelector("main") as HTMLElement).overflowY
      : null,
  }));
  expect(scrollState.bodyCanScroll).toBe(false);
  expect(scrollState.mainOverflowY).toBe("hidden");

  const initialBox = await board.boundingBox();
  expect(initialBox).not.toBeNull();
  if (initialBox) {
    const viewport = page.viewportSize();
    expect(initialBox.x).toBeGreaterThanOrEqual(0);
    expect(initialBox.y).toBeGreaterThanOrEqual(0);
    expect(initialBox.x + initialBox.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
    expect(initialBox.y + initialBox.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
  }

  await page.getByRole("tab", { name: "Blitz" }).click();
  await page.getByRole("button", { name: "Start Snake" }).click();
  await page.keyboard.press("KeyS");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();

  await page.keyboard.press("Space");
  await expect(page.getByText(/Snake status: Paused/i)).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();

  const box = await board.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 70, startY, { steps: 4 });
    await page.mouse.up();
  }

  await page.getByRole("button", { name: /Restart Snake/i }).click();
  await expect(page.getByText(/Score 0/i)).toBeAttached();
});

test("switches to a placeholder game with a finished unavailable state", async ({ page }) => {
  await page.goto("/games/minesweeper");

  await expect(page.getByRole("heading", { name: "Minesweeper", level: 2 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Minesweeper is not playable yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play Snake" }).click();
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();
});

test("plays Cipherword daily and opens archive", async ({ page }) => {
  await page.goto("/games/cipherword");

  await expect(page.getByLabel("Cipherword board and input")).toBeVisible();
  await page.getByLabel("Enter a Cipherword guess").fill("cipher");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByRole("dialog", { name: "cipher" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Share|Copied/ })).toBeVisible();

  await page.goto("/games/cipherword/archive");
  await expect(page.getByRole("heading", { name: "Cipherword Archive" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Play Cipherword archive 2026-06-01/ }),
  ).toBeVisible();

  await page.goto("/games/word-forge");
  await expect(page).toHaveURL(/\/games\/cipherword/);
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
