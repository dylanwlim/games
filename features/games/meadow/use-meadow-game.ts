"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  advanceMeadow,
  applyMeadowAction,
  createInitialMeadowState,
  getMeadowObjectives,
  getMeadowRunResult,
  parseMeadowState,
  restartMeadow,
  startMeadow,
  type MeadowAction,
  type MeadowState,
} from "./meadow-engine";

const meadowStateKey = "games:meadow-state-v1";

export function useMeadowGame() {
  const [state, setState] = useState<MeadowState>(() => createInitialMeadowState());
  const stateRef = useRef(state);
  const storageLoadedRef = useRef(false);

  const updateState = useCallback((updater: (previousState: MeadowState) => MeadowState) => {
    const nextState = updater(stateRef.current);
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    const storedState = parseMeadowState(window.localStorage.getItem(meadowStateKey));
    stateRef.current = storedState;
    setState(storedState);
    storageLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!storageLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(meadowStateKey, JSON.stringify(state));
  }, [state]);

  const actions = useMemo(
    () => ({
      advanceFrame(deltaMs: number) {
        updateState((previousState) => advanceMeadow(previousState, deltaMs));
      },
      dispatch(action: MeadowAction) {
        updateState((previousState) => applyMeadowAction(previousState, action));
      },
      restart() {
        updateState(() => restartMeadow());
      },
      togglePlay() {
        updateState((previousState) => startMeadow(previousState));
      },
    }),
    [updateState],
  );

  return {
    actions,
    objectives: getMeadowObjectives(state),
    runResult: getMeadowRunResult(state),
    state,
    stateRef,
  };
}
