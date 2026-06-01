"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  advanceSnakeClock,
  createSnakeState,
  isSnakeMode,
  queueDirection,
  restartSnake,
  snakeModeDefinitions,
  stepSnake,
  toggleSnakePlay,
} from "./snake-engine";
import { snakeModes, type Direction, type SnakeMode, type SnakeState } from "./snakeTypes";

const bestScoresKey = "dylan-games:snake-best-scores";
const lastModeKey = "dylan-games:snake-last-mode";

type SnakeViewState = {
  game: SnakeState;
  bestScores: Record<SnakeMode, number>;
};

const initialBestScores = Object.fromEntries(snakeModes.map((mode) => [mode, 0])) as Record<
  SnakeMode,
  number
>;

export function useSnakeGame() {
  const [viewState, setViewState] = useState<SnakeViewState>(() => ({
    game: createSnakeState(),
    bestScores: initialBestScores,
  }));
  const stateRef = useRef(viewState.game);
  const storageLoadedRef = useRef(false);
  const state = viewState.game;
  const bestScore = viewState.bestScores[state.mode] ?? 0;
  const topScore = Math.max(...Object.values(viewState.bestScores));

  const updateGame = useCallback((updater: (previousState: SnakeState) => SnakeState) => {
    setViewState((previousViewState) => {
      const game = updater(previousViewState.game);
      const currentBest = previousViewState.bestScores[game.mode] ?? 0;
      const bestScores =
        game.score > currentBest
          ? {
              ...previousViewState.bestScores,
              [game.mode]: game.score,
            }
          : previousViewState.bestScores;

      stateRef.current = game;

      return {
        game,
        bestScores,
      };
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let storedMode: SnakeMode | undefined;
    let storedBestScores = { ...initialBestScores };

    const rawMode = window.localStorage.getItem(lastModeKey);
    const rawBestScores = window.localStorage.getItem(bestScoresKey);

    if (rawMode && isSnakeMode(rawMode)) {
      storedMode = rawMode;
    }

    storedBestScores = parseStoredBestScores(rawBestScores);

    setViewState((previousViewState) => {
      const game =
        storedMode && storedMode !== previousViewState.game.mode
          ? createSnakeState({ mode: storedMode })
          : previousViewState.game;

      stateRef.current = game;

      return {
        game,
        bestScores: storedBestScores,
      };
    });
    storageLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(bestScoresKey, JSON.stringify(viewState.bestScores));
  }, [viewState.bestScores]);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(lastModeKey, state.mode);
  }, [state.mode]);

  const queueMove = useCallback(
    (direction: Direction) => {
      updateGame((previousState) => queueDirection(previousState, direction));
    },
    [updateGame],
  );

  const togglePlay = useCallback(() => {
    updateGame((previousState) => toggleSnakePlay(previousState));
  }, [updateGame]);

  const restart = useCallback(() => {
    updateGame((previousState) => restartSnake(previousState));
  }, [updateGame]);

  const pause = useCallback(() => {
    updateGame((previousState) =>
      previousState.status === "playing" ? { ...previousState, status: "paused" } : previousState,
    );
  }, [updateGame]);

  const selectMode = useCallback(
    (mode: SnakeMode) => {
      updateGame((previousState) =>
        previousState.mode === mode ? restartSnake(previousState) : createSnakeState({ mode }),
      );
    },
    [updateGame],
  );

  const advanceFrame = useCallback(
    ({ clockDeltaMs, steps }: { clockDeltaMs: number; steps: number }) => {
      updateGame((previousState) => {
        let nextState =
          clockDeltaMs > 0 ? advanceSnakeClock(previousState, clockDeltaMs) : previousState;

        for (let step = 0; step < steps && nextState.status === "playing"; step += 1) {
          nextState = stepSnake(nextState);
        }

        return nextState;
      });
    },
    [updateGame],
  );

  const actions = useMemo(
    () => ({
      advanceFrame,
      pause,
      queueMove,
      restart,
      selectMode,
      togglePlay,
    }),
    [advanceFrame, pause, queueMove, restart, selectMode, togglePlay],
  );

  return {
    state,
    stateRef,
    bestScore,
    bestScores: viewState.bestScores,
    topScore,
    modeDefinition: snakeModeDefinitions[state.mode],
    actions,
  };
}

function parseStoredBestScores(rawBestScores: string | null): Record<SnakeMode, number> {
  if (!rawBestScores) {
    return { ...initialBestScores };
  }

  try {
    const parsed = JSON.parse(rawBestScores) as unknown;
    const storedScores =
      parsed && typeof parsed === "object" ? (parsed as Partial<Record<SnakeMode, unknown>>) : {};

    return snakeModes.reduce<Record<SnakeMode, number>>(
      (scores, mode) => ({
        ...scores,
        [mode]: normalizeStoredScore(storedScores[mode]),
      }),
      { ...initialBestScores },
    );
  } catch {
    return { ...initialBestScores };
  }
}

function normalizeStoredScore(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
    return 0;
  }

  return Math.floor(score);
}
