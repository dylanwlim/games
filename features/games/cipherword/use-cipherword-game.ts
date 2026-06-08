"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getCanonicalCipherwordDate } from "./daily-answers";
import {
  createCipherwordRound,
  replayCipherwordGuesses,
  submitCipherwordGuess,
  toCipherwordRoundResult,
} from "./game-engine";
import {
  cipherwordRecentUnlimitedKey,
  cipherwordStatsStorageKey,
  createDefaultCipherwordStats,
  getUnlockedAchievements,
  parseCipherwordStats,
  serializeCipherwordStats,
  updateStatsAfterRound,
} from "./stats";
import type {
  AchievementUnlock,
  CipherwordMode,
  CipherwordRoundResult,
  CipherwordRoundState,
  CipherwordStats,
} from "./types";

const progressPrefix = "dylan-games:cipherword-progress:v1";

export function useCipherwordGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMode = parseMode(searchParams.get("mode"));
  const queryDate = searchParams.get("date") ?? undefined;
  const initialMode = queryMode ?? "daily";
  const initialDate = queryDate ?? getCanonicalCipherwordDate();
  const [stats, setStats] = useState<CipherwordStats>(() => createDefaultCipherwordStats());
  const [round, setRound] = useState<CipherwordRoundState>(() =>
    createCipherwordRound({ mode: initialMode, dateKey: initialDate }),
  );
  const [lastResult, setLastResult] = useState<CipherwordRoundResult | null>(null);
  const [achievementUnlocks, setAchievementUnlocks] = useState<AchievementUnlock[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const currentMode = round.mode;
  const progressKey = useMemo(() => getProgressKey(round), [round]);
  const todayKey = useMemo(() => getCanonicalCipherwordDate(), []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedStats = readStorage(cipherwordStatsStorageKey, setStorageAvailable);
      setStats(parseCipherwordStats(storedStats));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const mode = queryMode ?? "daily";
      const dateKey = queryDate ?? getCanonicalCipherwordDate();
      const recentIds = readRecentUnlimitedIds(setStorageAvailable);
      const nextRound = createCipherwordRound({
        mode,
        dateKey,
        recentUnlimitedIds: recentIds,
        seed: Date.now(),
      });
      const key = getProgressKey(nextRound);
      const rawProgress = readStorage(key, setStorageAvailable);
      const completed = stats.completedPuzzles[nextRound.puzzleId];
      const savedGuesses = completed?.guesses ?? parseProgress(rawProgress);
      const replayed = savedGuesses.length
        ? replayCipherwordGuesses(nextRound, savedGuesses)
        : nextRound;

      setRound(replayed);
      setLastResult(
        replayed.status === "won" || replayed.status === "lost"
          ? toCipherwordRoundResult(replayed)
          : null,
      );
      setAchievementUnlocks([]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [queryDate, queryMode, stats.completedPuzzles]);

  const selectMode = useCallback(
    (mode: CipherwordMode) => {
      if (mode === "archive") {
        router.push("/games/cipher/archive" as Route);
        return;
      }

      const href = mode === "daily" ? "/games/cipher" : `/games/cipher?mode=${mode}`;
      router.push(href as Route, { scroll: false });
    },
    [router],
  );

  const submitGuess = useCallback((rawGuess: string) => {
    setRound((currentRound) => {
      const nextRound = submitCipherwordGuess(currentRound, rawGuess);

      if (nextRound !== currentRound && nextRound.error === undefined) {
        persistProgress(nextRound, setStorageAvailable);
      }

      if (
        nextRound.status !== currentRound.status &&
        (nextRound.status === "won" || nextRound.status === "lost")
      ) {
        const result = toCipherwordRoundResult(nextRound);
        setLastResult(result);
        setStats((currentStats) => {
          const after = updateStatsAfterRound(currentStats, result);
          const unlocks = getUnlockedAchievements(currentStats, after);
          setAchievementUnlocks(unlocks);
          writeStorage(
            cipherwordStatsStorageKey,
            serializeCipherwordStats(after),
            setStorageAvailable,
          );

          if (result.mode === "unlimited" || result.mode === "zen") {
            writeRecentUnlimitedId(result.puzzleId, setStorageAvailable);
          }

          return after;
        });
      }

      return nextRound;
    });
  }, []);

  const restart = useCallback(() => {
    const recentIds = readRecentUnlimitedIds(setStorageAvailable);
    const nextRound = createCipherwordRound({
      mode: currentMode,
      dateKey: round.dateKey,
      recentUnlimitedIds: recentIds,
      seed: Date.now(),
    });

    removeStorage(getProgressKey(round), setStorageAvailable);
    setRound(nextRound);
    setLastResult(null);
    setAchievementUnlocks([]);
  }, [currentMode, round]);

  const toggleHighContrast = useCallback(() => {
    setStats((currentStats) => {
      const next = {
        ...currentStats,
        settings: {
          ...currentStats.settings,
          highContrast: !currentStats.settings.highContrast,
        },
      };

      writeStorage(cipherwordStatsStorageKey, serializeCipherwordStats(next), setStorageAvailable);
      return next;
    });
  }, []);

  const dismissResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    round,
    stats,
    todayKey,
    progressKey,
    lastResult,
    achievementUnlocks,
    storageAvailable,
    actions: {
      dismissResult,
      restart,
      selectMode,
      submitGuess,
      toggleHighContrast,
    },
  };
}

function parseMode(value: string | null): CipherwordMode | undefined {
  if (
    value === "daily" ||
    value === "archive" ||
    value === "unlimited" ||
    value === "hard" ||
    value === "zen"
  ) {
    return value;
  }

  return undefined;
}

function getProgressKey(round: CipherwordRoundState) {
  return `${progressPrefix}:${round.mode}:${round.dateKey ?? round.puzzleId}`;
}

function parseProgress(raw: string | null) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function persistProgress(
  round: CipherwordRoundState,
  setStorageAvailable: (available: boolean) => void,
) {
  writeStorage(
    getProgressKey(round),
    JSON.stringify(round.guesses.map((guess) => guess.guess)),
    setStorageAvailable,
  );
}

function readStorage(key: string, setStorageAvailable: (available: boolean) => void) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    setStorageAvailable(false);
    return null;
  }
}

function writeStorage(
  key: string,
  value: string,
  setStorageAvailable: (available: boolean) => void,
) {
  try {
    window.localStorage.setItem(key, value);
    setStorageAvailable(true);
  } catch {
    setStorageAvailable(false);
  }
}

function removeStorage(key: string, setStorageAvailable: (available: boolean) => void) {
  try {
    window.localStorage.removeItem(key);
    setStorageAvailable(true);
  } catch {
    setStorageAvailable(false);
  }
}

function readRecentUnlimitedIds(setStorageAvailable: (available: boolean) => void) {
  return parseProgress(readStorage(cipherwordRecentUnlimitedKey, setStorageAvailable));
}

function writeRecentUnlimitedId(
  puzzleId: string,
  setStorageAvailable: (available: boolean) => void,
) {
  const current = readRecentUnlimitedIds(setStorageAvailable);
  const next = [puzzleId, ...current.filter((id) => id !== puzzleId)].slice(0, 10);

  writeStorage(cipherwordRecentUnlimitedKey, JSON.stringify(next), setStorageAvailable);
}
