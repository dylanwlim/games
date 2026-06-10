import { createHmac } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

const hydrationErrorPattern = /Hydration failed|A tree hydrated/u;
const sessionCookieName = "games_dwl_session";
const appSecret = process.env.DWL_APP_SECRET ?? "playwright-secret";

function createDwlSessionCookie() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const session = {
    expiresAt: issuedAt + 60 * 60,
    issuedAt,
    user: {
      email: "playwright@dylanwlim.com",
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      id: "playwright-user",
      image: null,
      name: "Playwright User",
    },
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = createHmac("sha256", appSecret).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

async function signInWithDwlSession(page: Page) {
  await page.context().addCookies([
    {
      domain: "127.0.0.1",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
      httpOnly: true,
      name: sessionCookieName,
      path: "/",
      sameSite: "Lax",
      secure: false,
      value: createDwlSessionCookie(),
    },
  ]);
}

test("renders the stripped Games hub with the updated sidebar", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(page).toHaveTitle(/Dylan Games/);
  await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Featured games" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Play Snake from showcase" })).toBeVisible();
  await expect(page.locator('a.available-game-card[href="/games/snake"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continue Playing" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toHaveCount(0);

  await page.getByRole("button", { name: "Open navigation" }).click();
  const sidebar = page.locator("#arcade-sidebar");
  await expect(sidebar.getByRole("link", { name: "Achievements" })).toBeVisible();
  await expect(sidebar.getByText("Games", { exact: true })).toHaveCount(2);
  await expect(sidebar.getByRole("link", { name: "Snake", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Favorites" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "Discover" })).toHaveCount(0);
  await expect(page.getByText("Genres", { exact: true })).toHaveCount(0);

  const search = page.getByLabel("Search games");
  await search.fill("snake");
  await expect(page.locator('a.available-game-card[href="/games/snake"]')).toBeVisible();
  await search.fill("cipher");
  await expect(page.locator('a.available-game-card[href="/games/snake"]')).toHaveCount(0);

  expect(consoleErrors.filter((message) => hydrationErrorPattern.test(message))).toEqual([]);
});

test("requires a DWL Accounts session before Snake can be played", async ({ page }) => {
  await page.goto("/games/snake");

  await expect(page.getByRole("heading", { name: "Sign in to play Snake." })).toBeVisible();
  await expect(page.getByLabel(/Snake board/i)).toHaveCount(0);
  await expect(
    page.locator(".account-gate").getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", /accounts\.dylanwlim\.com\/sign-in/);
});

test("plays Snake with a DWL Accounts session", async ({ page }) => {
  await signInWithDwlSession(page);
  await page.goto("/games/snake");

  const board = page.getByLabel(/Snake board/i);
  await expect(board).toBeVisible();
  await expect(page.getByRole("heading", { name: "Snake", level: 2 })).toBeVisible();
  await expect(page.getByLabel("Account progression")).toBeVisible();

  const scrollState = await page.evaluate(() => ({
    bodyCanScroll: (document.scrollingElement?.scrollHeight ?? 0) > window.innerHeight + 1,
    mainOverflowY: document.querySelector("main")
      ? window.getComputedStyle(document.querySelector("main") as HTMLElement).overflowY
      : null,
  }));
  expect(scrollState.bodyCanScroll).toBe(false);
  expect(scrollState.mainOverflowY).toBe("hidden");

  await page.getByRole("tab", { name: "Blitz" }).click();
  await page.getByRole("button", { name: "Start Snake" }).click();
  await page.keyboard.press("KeyS");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByText(/Snake status: Paused/i)).toBeAttached();
  await page.keyboard.press("Space");
  await expect(page.getByText(/Snake status: Playing/i)).toBeAttached();
  await page.getByRole("button", { name: /Restart Snake/i }).click();
  await expect(page.getByText(/Score 0/i)).toBeAttached();
});

test("renders achievements from synced game progression", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "games:progression-v1",
      JSON.stringify({
        achievements: {
          "snake-first-run": {
            unlockedAt: new Date().toISOString(),
            xp: 25,
          },
        },
        games: {
          snake: {
            bestScore: 80,
            completedRuns: 2,
            foodEaten: 6,
            modesTried: ["classic"],
            xp: 120,
          },
        },
        level: 2,
        totalXp: 145,
        updatedAt: new Date().toISOString(),
        version: 1,
      }),
    );
  });

  await page.goto("/achievements");

  await expect(page.getByRole("heading", { name: "Achievements", level: 1 })).toBeVisible();
  await expect(page.getByText("145")).toBeVisible();
  await expect(page.locator(".achievement-card.unlocked", { hasText: "First Run" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Play Snake" })).toBeVisible();
});

test("supports light and dark color schemes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const lightBackground = await page.evaluate(
    () => window.getComputedStyle(document.body).backgroundColor,
  );

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  const darkBackground = await page.evaluate(
    () => window.getComputedStyle(document.body).backgroundColor,
  );

  expect(lightBackground).not.toBe(darkBackground);
  await expect(page.getByRole("heading", { name: "Games", level: 1 })).toBeVisible();
});

test("keeps soft-launch robots metadata", async ({ page }) => {
  await page.goto("/");

  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
});
