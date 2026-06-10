"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createInitialProgression,
  getLevelProgress,
  parseProgression,
  progressionStorageKey,
  recordMeadowRun as recordMeadowRunProgression,
  recordSnakeRun as recordSnakeRunProgression,
  type GameProgression,
  type ProgressionUpdate,
  type SnakeRunResult,
} from "@/features/games/progression";
import type { MeadowRunResult } from "@/features/games/meadow/meadow-engine";

export function useGameProgression() {
  const [progression, setProgression] = useState<GameProgression>(() => createInitialProgression());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setProgression(parseProgression(window.localStorage.getItem(progressionStorageKey)));
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const persist = useCallback((nextProgression: GameProgression) => {
    window.localStorage.setItem(progressionStorageKey, JSON.stringify(nextProgression));
  }, []);

  const recordSnakeRun = useCallback(
    (run: SnakeRunResult): ProgressionUpdate => {
      let update: ProgressionUpdate | null = null;

      setProgression((previousProgression) => {
        update = recordSnakeRunProgression(previousProgression, run);
        persist(update.nextProgression);
        return update.nextProgression;
      });

      return (
        update ?? {
          nextProgression: progression,
          runXp: 0,
          unlockedAchievements: [],
        }
      );
    },
    [persist, progression],
  );

  const recordMeadowRun = useCallback(
    (run: MeadowRunResult): ProgressionUpdate => {
      let update: ProgressionUpdate | null = null;

      setProgression((previousProgression) => {
        update = recordMeadowRunProgression(previousProgression, run);
        persist(update.nextProgression);
        return update.nextProgression;
      });

      return (
        update ?? {
          nextProgression: progression,
          runXp: 0,
          unlockedAchievements: [],
        }
      );
    },
    [persist, progression],
  );

  const levelProgress = useMemo(() => getLevelProgress(progression.totalXp), [progression.totalXp]);

  return {
    loaded,
    levelProgress,
    progression,
    recordMeadowRun,
    recordSnakeRun,
  };
}
