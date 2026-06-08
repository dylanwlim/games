import { expect, test } from "@playwright/test";

import {
  getCanonicalCipherwordDate,
  getCipherwordDailyAnswerForDate,
} from "../../features/games/cipherword/daily-answers";

test("renders the hub and launches the featured Cipher game", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Dylan Games/);
  await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    const sidebar = page.locator("#arcade-sidebar");
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox).not.toBeNull();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("button", { name: "Close navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "dylanwlim.com" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Favorites" })).toBeVisible();
    const expandedBox = await sidebar.boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(expandedBox!.width).toBeGreaterThan((collapsedBox?.width ?? 0) + 120);
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeLessThanOrEqual((collapsedBox?.width ?? 0) + 4);
  }
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Playable Games" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show next featured game" })).toBeVisible();
  await expect(page.getByText("Game Center")).toHaveCount(0);
  await expect(page.getByText("Get", { exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Play Cipher from Featured" }).click();
  await expect(page).toHaveURL(/\/games\/cipher/);
  await expect(page.getByRole("heading", { name: "Cipher", level: 2 })).toBeVisible();
  await expect(page.getByLabel("Cipher board and input")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Playable Games" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toHaveCount(0);

  await page.getByLabel("Enter a Cipher guess").fill("code");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.locator(".cipherword-feedback")).toContainText(
    /Far from the answer|Warm|Hot|Very close|Burning/,
  );
});

test("filters sidebar search by fuzzy game and category names", async ({ page }) => {
  await page.goto("/");

  const isMobile = (page.viewportSize()?.width ?? 0) < 900;
  await page.getByRole("button", { name: "Open navigation" }).click();
  let search = page.getByLabel("Search games");
  const sidebar = page.locator("#arcade-sidebar");
  await expect(search).toBeVisible();

  const activeLinkBackground = await page
    .locator("#arcade-sidebar")
    .getByRole("link", { name: "Games", exact: true })
    .evaluate((element) => ({
      active: element.getAttribute("data-active"),
      background: window.getComputedStyle(element).backgroundColor,
    }));
  const searchBackground = await search.evaluate(
    (element) =>
      window.getComputedStyle(element.closest('[data-sidebar="group"]') as HTMLElement)
        .backgroundColor,
  );

  expect(activeLinkBackground.active).toBe("true");
  expect(activeLinkBackground.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(searchBackground).toBe("rgba(0, 0, 0, 0)");

  if (!isMobile) {
    const beforeHoverBox = await sidebar
      .getByRole("link", { name: "Favorites", exact: true })
      .boundingBox();
    await sidebar.getByRole("link", { name: "Favorites", exact: true }).hover();
    const afterHoverBox = await sidebar
      .getByRole("link", { name: "Favorites", exact: true })
      .boundingBox();
    expect(beforeHoverBox).not.toBeNull();
    expect(afterHoverBox).not.toBeNull();
    expect(afterHoverBox!.width).toBeCloseTo(beforeHoverBox!.width, 0);
    expect(afterHoverBox!.height).toBeCloseTo(beforeHoverBox!.height, 0);
  }

  const fillSidebarSearch = async (value: string) => {
    if (isMobile && !(await search.isVisible())) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      search = page.getByLabel("Search games");
      await expect(search).toBeVisible();
    }

    await search.fill(value);

    if (isMobile) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    }
  };

  await fillSidebarSearch("puzl");
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

  await fillSidebarSearch("snkae");
  await expect(page.locator('a.store-game-card[href="/games/snake"]')).toBeVisible();
  await expect(page.locator(".store-game-card", { hasText: "Minesweeper" })).toHaveCount(0);

  await fillSidebarSearch("semantic");
  await expect(page.locator('a.store-game-card[href="/games/cipher"]')).toBeVisible();
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

test("opens Cipher from every Cipher entry point", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Play Cipher from Featured" }).click();
  await expect(page).toHaveURL(/\/games\/cipher/);
  await expect(page.getByLabel("Cipher board and input")).toBeVisible();

  await page.goto("/");
  await page.locator('a.store-game-card[href="/games/cipher"]').click();
  await expect(page).toHaveURL(/\/games\/cipher/);

  await page.goto("/games/favorites");
  await page.locator('a.collection-primary-action[href="/games/cipher"]').click();
  await expect(page).toHaveURL(/\/games\/cipher/);

  await page.goto("/games/favorites");
  await page.locator('a.template-game-card[href="/games/cipher"]').click();
  await expect(page).toHaveURL(/\/games\/cipher/);

  await page.goto("/genres/word");
  await page.locator('a.template-game-card[href="/games/cipher"]').click();
  await expect(page).toHaveURL(/\/games\/cipher/);

  await page.goto("/discover");
  await page.locator('a.template-game-card[href="/games/cipher"]').click();
  await expect(page).toHaveURL(/\/games\/cipher/);
});

test("plays Snake with keyboard, modes, restart, and touch swipe", async ({ page }) => {
  await page.goto("/games/snake");

  const board = page.getByLabel(/Snake board/i);
  await expect(board).toBeVisible();
  await expect(page.getByRole("heading", { name: "Playable Games" })).toHaveCount(0);
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

test("plays Cipher daily and opens archive", async ({ page }) => {
  const todayKey = getCanonicalCipherwordDate();
  const dailyAnswer = getCipherwordDailyAnswerForDate(todayKey);

  if (!dailyAnswer) {
    throw new Error(`No Cipher daily answer for ${todayKey}`);
  }

  await page.goto("/games/cipher");

  await expect(page.getByLabel("Cipher board and input")).toBeVisible();
  await page.getByLabel("Enter a Cipher guess").fill(dailyAnswer);
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByRole("dialog", { name: dailyAnswer })).toBeVisible();
  await expect(page.getByRole("button", { name: /Share|Copied/ })).toBeVisible();

  await page.goto("/games/cipher/archive");
  await expect(page.getByRole("heading", { name: "Cipher Archive" })).toBeVisible();
  await expect(page.getByRole("link", { name: `Play Cipher archive ${todayKey}` })).toBeVisible();

  await page.goto("/games/word-forge");
  await expect(page).toHaveURL(/\/games\/cipher/);
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
