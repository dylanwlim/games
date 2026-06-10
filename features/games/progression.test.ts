import { describe, expect, it } from "vitest";

import {
  computeSnakeRunXp,
  createInitialProgression,
  getLevelForXp,
  parseProgression,
  progressionStorageKey,
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
    expect(parsed.games.snake.bestScore).toBe(50);
    expect(parsed.games.snake.modesTried).toEqual(["classic", "zen"]);
  });
});
