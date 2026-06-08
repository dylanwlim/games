import { describe, expect, it } from "vitest";

import {
  CIPHERWORD_DAILY_ANSWERS,
  getCipherwordArchiveEntry,
  getCipherwordDailyAnswerForDate,
  getCipherwordDailyIndex,
  getCipherwordDateForIndex,
  validateCipherwordDailyBank,
} from "./daily-answers";
import {
  createCipherwordRound,
  getVisibleScore,
  submitCipherwordGuess,
  toCipherwordRoundResult,
} from "./game-engine";
import { getLetterFeedback } from "./letter-feedback";
import { normalizeAnswer, normalizeDisplay } from "./normalize";
import { getCipherwordPuzzleForAnswer } from "./puzzle-factory";
import { scoreGuess } from "./semantic-score";
import { getShareText } from "./share";
import {
  createDefaultCipherwordStats,
  parseCipherwordStats,
  serializeCipherwordStats,
  updateStatsAfterRound,
} from "./stats";
import type { CipherwordRoundState } from "./types";

describe("cipherword engine", () => {
  it("normalizes display and answer values", () => {
    expect(normalizeDisplay("  Black-Swan!! ")).toBe("black swan");
    expect(normalizeAnswer("Black Swan!!")).toBe("blackswan");
  });

  it("handles duplicate-safe letter feedback", () => {
    expect(getLetterFeedback("allee", "eagle")).toEqual([
      "present",
      "present",
      "absent",
      "present",
      "correct",
    ]);
  });

  it("maps daily dates without modulo repeats", () => {
    expect(CIPHERWORD_DAILY_ANSWERS).toHaveLength(8_980);
    expect(new Set(CIPHERWORD_DAILY_ANSWERS).size).toBe(8_980);
    expect(validateCipherwordDailyBank()).toEqual({
      ok: true,
      count: 8_980,
      startDate: "2026-06-01",
      endDate: "2050-12-31",
    });
    expect(getCipherwordDailyIndex("2026-06-01")).toBe(0);
    expect(getCipherwordDateForIndex(0)).toBe("2026-06-01");
    expect(getCipherwordDailyIndex("2050-12-31")).toBe(8_979);
    expect(getCipherwordDateForIndex(8_979)).toBe("2050-12-31");
    expect(getCipherwordDailyAnswerForDate("2026-06-01")).toBe("cipher");
    expect(getCipherwordDailyAnswerForDate("2050-12-31")).toBe("interplay");
    expect(getCipherwordDailyAnswerForDate("2051-01-01")).toBeNull();
  });

  it("locks future archive dates and opens past or today", () => {
    const now = new Date("2026-06-02T16:00:00.000Z");

    expect(getCipherwordArchiveEntry("2026-06-01", now).status).toBe("available");
    expect(getCipherwordArchiveEntry("2026-06-02", now).status).toBe("today");
    expect(getCipherwordArchiveEntry("2026-06-03", now).status).toBe("locked");
  });

  it("retrieves the expected daily puzzle", () => {
    const round = createCipherwordRound({
      mode: "daily",
      dateKey: "2026-06-01",
      now: new Date("2026-06-01T16:00:00.000Z"),
    });

    expect(round.puzzle.answer).toBe("cipher");
    expect(round.puzzleId).toBe("cipherword-daily-2026-06-01");
  });

  it("wins on exact aliases and rejects repeated guesses without consuming attempts", () => {
    const puzzle = getCipherwordPuzzleForAnswer("black swan");
    const base = testRound(puzzle);
    const wrong = submitCipherwordGuess(base, "crash");
    const repeated = submitCipherwordGuess(wrong, "crash");
    const solved = submitCipherwordGuess(repeated, "blackswan");

    expect(wrong.guesses).toHaveLength(1);
    expect(repeated.guesses).toHaveLength(1);
    expect(repeated.error).toBe("Already guessed.");
    expect(solved.status).toBe("won");
  });

  it("rejects phrase and non-letter guesses without consuming attempts", () => {
    const puzzle = getCipherwordPuzzleForAnswer("cipher");
    const base = testRound(puzzle);
    const phrase = submitCipherwordGuess(base, "secret code");
    const symbol = submitCipherwordGuess(base, "code2");

    expect(phrase.error).toBe("Use one word only.");
    expect(symbol.error).toBe("Use letters only.");
    expect(phrase.guesses).toHaveLength(0);
    expect(symbol.guesses).toHaveLength(0);
  });

  it("sets loss state when guesses run out", () => {
    const puzzle = getCipherwordPuzzleForAnswer("cipher");
    const round = testRound(puzzle, 1);
    const lost = submitCipherwordGuess(round, "orbit");

    expect(lost.status).toBe("lost");
  });

  it("lets direct semantic near terms outrank weak letter similarity", () => {
    const puzzle = getCipherwordPuzzleForAnswer("orbit");
    const near = scoreGuess("rotation", puzzle);
    const letters = scoreGuess("orbits", puzzle);

    expect(near.score).toBeGreaterThanOrEqual(70);
    expect(near.score).toBeGreaterThan(letters.score);
  });

  it("hides exact scores in hard mode", () => {
    const hard = createCipherwordRound({ mode: "hard", dateKey: "2026-06-01" });
    const next = submitCipherwordGuess(hard, "code");

    expect(getVisibleScore(next.guesses[0], "hard")).toBeNull();
  });

  it("persists stats, streaks, and completed puzzle results", () => {
    const base = createDefaultCipherwordStats();
    const dayOne = submitCipherwordGuess(
      createCipherwordRound({ mode: "daily", dateKey: "2026-06-01" }),
      "cipher",
    );
    const afterDayOne = updateStatsAfterRound(base, toCipherwordRoundResult(dayOne));
    const dayTwo = submitCipherwordGuess(
      createCipherwordRound({ mode: "daily", dateKey: "2026-06-02" }),
      "signal",
    );
    const afterDayTwo = updateStatsAfterRound(afterDayOne, toCipherwordRoundResult(dayTwo));
    const restored = parseCipherwordStats(serializeCipherwordStats(afterDayTwo));

    expect(restored.daily.currentStreak).toBe(2);
    expect(restored.daily.bestStreak).toBe(2);
    expect(Object.keys(restored.completedPuzzles)).toHaveLength(2);
  });

  it("keeps share text spoiler-free", () => {
    const round = submitCipherwordGuess(
      createCipherwordRound({ mode: "daily", dateKey: "2026-06-02" }),
      "signal",
    );
    const share = getShareText(toCipherwordRoundResult(round)).toLowerCase();

    expect(share).not.toContain("signal");
    expect(share).toContain("cipher");
  });
});

function testRound(puzzle: CipherwordRoundState["puzzle"], maxGuesses = 7): CipherwordRoundState {
  return {
    puzzle,
    mode: "unlimited",
    puzzleId: `test-${puzzle.id}`,
    status: "playing",
    maxGuesses,
    guesses: [],
    startedAt: "2026-06-01T16:00:00.000Z",
  };
}
