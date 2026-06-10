import { describe, expect, it } from "vitest";

import {
  computeSnakeRunXp,
  computeMeadowRunXp,
  createInitialProgression,
  getLevelForXp,
  parseProgression,
  progressionStorageKey,
  recordMeadowRun,
  recordSnakeRun,
} from "./progression";

describe("game progression", () => {
  it("uses the games localStorage namespace for DWL account sync", () => {
    expect(progressionStorageKey).toBe("games:progression-v1");
  });

  it("awards Snake XP and achievements into one global total", () => {
    const result = recordSnakeRun(createInitialProgression(), {
      elapsedMs: 30_000,
      foodsEaten: 8,
      mode: "classic",
      score: 120,
    });

    expect(result.runXp).toBe(
      computeSnakeRunXp({ elapsedMs: 30_000, foodsEaten: 8, mode: "classic", score: 120 }),
    );
    expect(result.nextProgression.games.snake.bestScore).toBe(120);
    expect(result.nextProgression.games.snake.completedRuns).toBe(1);
    expect(result.nextProgression.totalXp).toBeGreaterThan(result.runXp);
    expect(result.unlockedAchievements.map((achievement) => achievement.id)).toEqual([
      "snake-first-run",
      "snake-first-apple",
      "snake-score-100",
    ]);
  });

  it("awards Meadow XP and achievements into the shared account total", () => {
    const run = {
      cash: 180,
      claimedSpawns: 1,
      elapsedMs: 90_000,
      maxTier: 3,
      objectivesCompleted: 4,
      score: 280,
    };
    const result = recordMeadowRun(createInitialProgression(), run);

    expect(result.runXp).toBe(computeMeadowRunXp(run));
    expect(result.nextProgression.games.meadow.bestScore).toBe(280);
    expect(result.nextProgression.games.meadow.completedRuns).toBe(1);
    expect(result.nextProgression.games.meadow.claimedSpawns).toBe(1);
    expect(result.nextProgression.totalXp).toBeGreaterThan(result.runXp);
    expect(result.unlockedAchievements.map((achievement) => achievement.id)).toEqual([
      "meadow-first-shift",
      "meadow-rare-feed",
      "meadow-tier-3",
      "meadow-score-250",
    ]);
  });

  it("does not award the same achievement twice", () => {
    const first = recordSnakeRun(createInitialProgression(), {
      elapsedMs: 10_000,
      foodsEaten: 1,
      mode: "classic",
      score: 10,
    }).nextProgression;
    const second = recordSnakeRun(first, {
      elapsedMs: 12_000,
      foodsEaten: 1,
      mode: "classic",
      score: 20,
    });

    expect(second.unlockedAchievements).toEqual([]);
    expect(Object.keys(second.nextProgression.achievements)).toEqual([
      "snake-first-run",
      "snake-first-apple",
    ]);
  });

  it("normalizes stored progression safely", () => {
    const parsed = parseProgression(
      JSON.stringify({
        totalXp: 260,
        games: {
          meadow: {
            bestScore: 240.8,
            cashBanked: 120,
            claimedSpawns: 1,
            completedRuns: 1,
            maxTier: 2,
            objectivesCompleted: 4,
            xp: 90,
          },
          snake: {
            bestScore: 50.8,
            completedRuns: 2,
            foodEaten: 4,
            modesTried: ["classic", "bad-mode", "zen"],
            xp: 120,
          },
        },
      }),
    );

    expect(parsed.level).toBe(getLevelForXp(260));
    expect(parsed.games.meadow.bestScore).toBe(240);
    expect(parsed.games.meadow.maxTier).toBe(2);
    expect(parsed.games.snake.bestScore).toBe(50);
    expect(parsed.games.snake.modesTried).toEqual(["classic", "zen"]);
  });
});
