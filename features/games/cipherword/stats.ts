import { cipherwordAchievements } from "./achievements";
import { addDaysToIsoDate, utcOrdinalFromIsoDate } from "./daily-answers";
import { CIPHERWORD_CATEGORIES } from "./puzzles";
import type {
  AchievementUnlock,
  CipherwordCompletedPuzzle,
  CipherwordRoundResult,
  CipherwordStats,
} from "./types";

export const cipherwordStatsVersion = 1;
export const cipherwordStatsStorageKey = "games:cipherword-stats:v1";
export const legacyCipherwordStatsStorageKey = "dylan-games:cipherword-stats:v1";
export const cipherwordRecentUnlimitedKey = "games:cipherword-recent-unlimited:v1";
export const legacyCipherwordRecentUnlimitedKey =
  "dylan-games:cipherword-recent-unlimited:v1";

export function createDefaultCipherwordStats(): CipherwordStats {
  return {
    version: cipherwordStatsVersion,
    daily: {
      solvedDates: [],
      currentStreak: 0,
      bestStreak: 0,
    },
    archive: {
      solvedDates: [],
    },
    totals: {
      played: 0,
      solved: 0,
      losses: 0,
      currentUnlimitedRun: 0,
      bestUnlimitedRun: 0,
    },
    guessDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
    },
    categorySolves: Object.fromEntries(
      CIPHERWORD_CATEGORIES.map((category) => [category, 0]),
    ) as CipherwordStats["categorySolves"],
    achievements: Object.fromEntries(
      cipherwordAchievements.map((achievement) => [achievement.id, {}]),
    ) as CipherwordStats["achievements"],
    settings: {
      hardMode: false,
      highContrast: false,
    },
    completedPuzzles: {},
  };
}

export function parseCipherwordStats(raw: string | null): CipherwordStats {
  if (!raw) {
    return createDefaultCipherwordStats();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CipherwordStats>;
    const defaults = createDefaultCipherwordStats();

    return {
      ...defaults,
      ...parsed,
      daily: {
        ...defaults.daily,
        ...parsed.daily,
        solvedDates: uniqueStrings(parsed.daily?.solvedDates),
      },
      archive: {
        ...defaults.archive,
        ...parsed.archive,
        solvedDates: uniqueStrings(parsed.archive?.solvedDates),
      },
      totals: {
        ...defaults.totals,
        ...parsed.totals,
      },
      guessDistribution: {
        ...defaults.guessDistribution,
        ...parsed.guessDistribution,
      },
      categorySolves: {
        ...defaults.categorySolves,
        ...parsed.categorySolves,
      },
      achievements: {
        ...defaults.achievements,
        ...parsed.achievements,
      },
      settings: {
        ...defaults.settings,
        ...parsed.settings,
      },
      completedPuzzles: parsed.completedPuzzles ?? {},
    };
  } catch {
    return createDefaultCipherwordStats();
  }
}

export function serializeCipherwordStats(stats: CipherwordStats) {
  return JSON.stringify(stats);
}

export function updateStatsAfterRound(
  stats: CipherwordStats,
  result: CipherwordRoundResult,
  now = new Date(),
): CipherwordStats {
  const alreadyCompleted = stats.completedPuzzles[result.puzzleId];

  if (alreadyCompleted) {
    return stats;
  }

  const completed: CipherwordCompletedPuzzle = {
    puzzleId: result.puzzleId,
    mode: result.mode,
    dateKey: result.dateKey,
    solved: result.solved,
    guesses: result.guesses.map((guess) => guess.guess),
    scores: result.guesses.map((guess) => guess.score),
  };
  const next = structuredCloneStats(stats);

  next.completedPuzzles[result.puzzleId] = completed;
  next.totals.played += 1;
  next.daily.lastPlayedDate = result.mode === "daily" ? result.dateKey : next.daily.lastPlayedDate;

  if (result.solved) {
    next.totals.solved += 1;
    next.categorySolves[result.category] = (next.categorySolves[result.category] ?? 0) + 1;

    if (result.guesses.length >= 1 && result.guesses.length <= 7) {
      next.guessDistribution[result.guesses.length as 1 | 2 | 3 | 4 | 5 | 6 | 7] += 1;
    }

    if (result.mode === "daily") {
      next.daily.solvedDates = sortedUnique([...next.daily.solvedDates, result.dateKey]);
      next.daily.lastSolvedDate = result.dateKey;
      next.daily.currentStreak = getCurrentDailyStreak(next.daily.solvedDates, result.dateKey);
      next.daily.bestStreak = Math.max(next.daily.bestStreak, next.daily.currentStreak);
    }

    if (result.mode === "archive") {
      next.archive.solvedDates = sortedUnique([...next.archive.solvedDates, result.dateKey]);
    }

    if (result.mode === "unlimited" || result.mode === "zen") {
      next.totals.currentUnlimitedRun += 1;
      next.totals.bestUnlimitedRun = Math.max(
        next.totals.bestUnlimitedRun,
        next.totals.currentUnlimitedRun,
      );
    }
  } else {
    next.totals.losses += 1;

    if (result.mode === "unlimited" || result.mode === "zen") {
      next.totals.currentUnlimitedRun = 0;
    }
  }

  unlockAchievements(next, result, now);

  return next;
}

export function getUnlockedAchievements(
  before: CipherwordStats,
  after: CipherwordStats,
): AchievementUnlock[] {
  return cipherwordAchievements
    .filter(
      (achievement) =>
        !before.achievements[achievement.id]?.unlockedAt &&
        Boolean(after.achievements[achievement.id]?.unlockedAt),
    )
    .map((achievement) => ({ id: achievement.id, name: achievement.name }));
}

function unlockAchievements(stats: CipherwordStats, result: CipherwordRoundResult, now: Date) {
  const unlockedAt = now.toISOString();
  const solved = result.solved;
  const categorySolveCount = Object.values(stats.categorySolves).filter(
    (count) => count > 0,
  ).length;
  const firstGuessTier = result.guesses[0]?.tier;
  const burningCount = result.guesses.filter((guess) => guess.tier === "Burning").length;

  unlock(stats, "first-signal", solved, unlockedAt);
  unlock(stats, "three-streak", stats.daily.currentStreak >= 3, unlockedAt);
  unlock(stats, "seven-streak", stats.daily.currentStreak >= 7, unlockedAt);
  unlock(stats, "thirty-streak", stats.daily.currentStreak >= 30, unlockedAt);
  unlock(stats, "third-guess", solved && result.guesses.length <= 3, unlockedAt);
  unlock(
    stats,
    "final-guess",
    solved && result.maxGuesses !== null && result.guesses.length === result.maxGuesses,
    unlockedAt,
  );
  unlock(
    stats,
    "no-hot-needed",
    solved && (firstGuessTier === "Cold" || firstGuessTier === "Ice cold"),
    unlockedAt,
  );
  unlock(stats, "burning-path", solved && burningCount >= 2, unlockedAt);
  unlock(stats, "category-scout", categorySolveCount >= 5, unlockedAt);
  unlock(stats, "semanticist", stats.totals.solved >= 25, unlockedAt);
  unlock(stats, "hard-mode-clear", solved && result.mode === "hard", unlockedAt);
  unlock(stats, "daily-return", hasConsecutiveDailyPlay(stats), unlockedAt);
  unlock(stats, "time-traveler", solved && result.mode === "archive", unlockedAt);
  unlock(stats, "backfill", stats.archive.solvedDates.length >= 7, unlockedAt);
  unlock(
    stats,
    "calendar-sweep",
    hasSolvedFullAvailableMonth(stats.archive.solvedDates),
    unlockedAt,
  );
  unlock(stats, "launch-week", hasLaunchWeek(stats.archive.solvedDates), unlockedAt);
  unlock(stats, "historian", stats.archive.solvedDates.length >= 100, unlockedAt);
}

function unlock(
  stats: CipherwordStats,
  achievementId: string,
  condition: boolean,
  unlockedAt: string,
) {
  if (!condition || stats.achievements[achievementId]?.unlockedAt) {
    return;
  }

  stats.achievements[achievementId] = { unlockedAt };
}

function getCurrentDailyStreak(solvedDates: string[], latestDate: string) {
  const solved = new Set(solvedDates);
  let cursor = latestDate;
  let streak = 0;

  while (solved.has(cursor)) {
    streak += 1;
    cursor = addDaysToIsoDate(cursor, -1);
  }

  return streak;
}

function hasConsecutiveDailyPlay(stats: CipherwordStats) {
  const dates = sortedUnique([
    ...stats.daily.solvedDates,
    ...(stats.daily.lastPlayedDate ? [stats.daily.lastPlayedDate] : []),
  ]);

  return dates.some(
    (date, index) =>
      index > 0 && utcOrdinalFromIsoDate(date) - utcOrdinalFromIsoDate(dates[index - 1]) === 1,
  );
}

function hasLaunchWeek(solvedDates: string[]) {
  const solved = new Set(solvedDates);

  return Array.from({ length: 7 }, (_, index) => addDaysToIsoDate("2026-06-01", index)).every(
    (date) => solved.has(date),
  );
}

function hasSolvedFullAvailableMonth(solvedDates: string[]) {
  const solved = new Set(solvedDates);
  const byMonth = new Map<string, string[]>();

  solvedDates.forEach((date) => {
    const month = date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), date]);
  });

  return Array.from(byMonth.entries()).some(([month, dates]) => {
    const [year, monthIndex] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

    return dates.length >= daysInMonth && dates.every((date) => solved.has(date));
  });
}

function sortedUnique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function uniqueStrings(values: unknown) {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string")
    : [];
}

function structuredCloneStats(stats: CipherwordStats): CipherwordStats {
  return JSON.parse(JSON.stringify(stats)) as CipherwordStats;
}
