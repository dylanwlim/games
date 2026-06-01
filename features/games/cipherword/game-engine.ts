import {
  getCanonicalCipherwordDate,
  getCipherwordDailyAnswerForDate,
  getCipherwordDailyIndex,
} from "./dailyAnswers";
import { getLetterFeedback } from "./letterFeedback";
import {
  getAnswerShape,
  getNormalizedLetterCount,
  isSameNormalizedAnswer,
  normalizeAnswer,
  normalizeDisplay,
} from "./normalize";
import {
  getCipherwordPuzzleForAnswer,
  getCipherwordPuzzleIdForMode,
  getRandomCipherwordPuzzle,
} from "./puzzleFactory";
import type { CipherwordPuzzle } from "./puzzles";
import { cipherwordLexicon, scoreGuess } from "./semanticScore";
import type {
  CipherwordClue,
  CipherwordGuessResult,
  CipherwordMode,
  CipherwordRoundResult,
  CipherwordRoundState,
} from "./types";

export const cipherwordModeLabels: Record<CipherwordMode, string> = {
  daily: "Daily",
  archive: "Archive",
  unlimited: "Unlimited",
  hard: "Hard",
  zen: "Zen",
};

export const offensiveGuessBlocklist = new Set(["fuck", "shit", "bitch", "cunt", "slur"]);

export function createCipherwordRound({
  mode = "daily",
  dateKey,
  recentUnlimitedIds = [],
  now = new Date(),
  seed = Date.now(),
}: {
  mode?: CipherwordMode;
  dateKey?: string;
  recentUnlimitedIds?: string[];
  now?: Date;
  seed?: number;
} = {}): CipherwordRoundState {
  const effectiveDateKey = dateKey ?? getCanonicalCipherwordDate(now);

  if (mode === "daily" || mode === "archive" || mode === "hard") {
    const answer = getCipherwordDailyAnswerForDate(effectiveDateKey);

    if (!answer) {
      const fallbackPuzzle = getCipherwordPuzzleForAnswer("cipher");

      return {
        puzzle: fallbackPuzzle,
        mode,
        puzzleId: getCipherwordPuzzleIdForMode({
          mode,
          dateKey: effectiveDateKey,
          answer: fallbackPuzzle.answer,
        }),
        dateKey: effectiveDateKey,
        status: "unavailable",
        maxGuesses: getMaxGuesses(mode),
        guesses: [],
        message: "Daily bank needs extension.",
        bankExhausted: true,
        startedAt: now.toISOString(),
      };
    }

    const puzzle = getCipherwordPuzzleForAnswer(answer);

    return {
      puzzle,
      mode,
      puzzleId: getCipherwordPuzzleIdForMode({ mode, dateKey: effectiveDateKey, answer }),
      dateKey: effectiveDateKey,
      status: "playing",
      maxGuesses: getMaxGuesses(mode),
      guesses: [],
      startedAt: now.toISOString(),
    };
  }

  const puzzle = getRandomCipherwordPuzzle(recentUnlimitedIds, seed);

  return {
    puzzle,
    mode,
    puzzleId: getCipherwordPuzzleIdForMode({ mode, answer: puzzle.answer, seed }),
    status: "playing",
    maxGuesses: getMaxGuesses(mode),
    guesses: [],
    startedAt: now.toISOString(),
  };
}

export function submitCipherwordGuess(
  state: CipherwordRoundState,
  rawGuess: string,
  now = new Date(),
): CipherwordRoundState {
  if (state.status !== "playing") {
    return state;
  }

  const displayGuess = normalizeDisplay(rawGuess).slice(0, 32);
  const normalizedGuess = normalizeAnswer(displayGuess);

  if (!normalizedGuess) {
    return withError(state, "Enter a guess first.");
  }

  if (normalizedGuess.length < 2) {
    return withError(state, "Use at least two letters.");
  }

  if (offensiveGuessBlocklist.has(normalizedGuess)) {
    return withError(state, "Try a different word.");
  }

  if (state.guesses.some((guess) => guess.normalizedGuess === normalizedGuess)) {
    return withError(state, "Already guessed.");
  }

  const isExact = isSameNormalizedAnswer(displayGuess, state.puzzle.answer, state.puzzle.aliases);
  const score = scoreGuess(displayGuess, state.puzzle, cipherwordLexicon);
  const answerLength = getNormalizedLetterCount(state.puzzle.answer);
  const tileStates =
    normalizedGuess.length === answerLength
      ? getLetterFeedback(displayGuess, state.puzzle.answer)
      : [];
  const guess: CipherwordGuessResult = {
    ...score,
    id: `${state.puzzleId}-${state.guesses.length + 1}`,
    guess: displayGuess,
    normalizedGuess,
    isExact,
    score: isExact ? 100 : score.score,
    tier: isExact ? "Solved" : score.tier,
    hint: isExact ? "Solved." : score.hint,
    tileStates,
    answerShape: getAnswerShape(state.puzzle.answer),
  };
  const guesses = [...state.guesses, guess];
  const closestGuess = getClosestGuess([...state.guesses, guess]);
  const terminalStatus = isExact
    ? "won"
    : state.maxGuesses !== null && guesses.length >= state.maxGuesses
      ? "lost"
      : "playing";
  const nextState: CipherwordRoundState = {
    ...state,
    guesses,
    closestGuess,
    status: terminalStatus,
    error: undefined,
    message: isExact
      ? "Signal found."
      : terminalStatus === "lost"
        ? "Signal lost. Reveal unlocked."
        : guess.hint,
    finishedAt: terminalStatus === "playing" ? undefined : now.toISOString(),
  };
  const unlocked = getNewestUnlockedClue(nextState);

  if (!unlocked) {
    return nextState;
  }

  return {
    ...nextState,
    guesses: nextState.guesses.map((entry) =>
      entry.id === guess.id ? { ...entry, clue: unlocked } : entry,
    ),
  };
}

export function replayCipherwordGuesses(
  state: CipherwordRoundState,
  guesses: string[],
  now = new Date(),
) {
  return guesses.reduce(
    (currentState, guess) =>
      currentState.status === "playing"
        ? submitCipherwordGuess(currentState, guess, now)
        : currentState,
    state,
  );
}

export function getUnlockedClues(state: CipherwordRoundState): CipherwordClue[] {
  const ladder = getClueLadder(state.puzzle);
  const guessCount = state.guesses.length;
  const schedule = state.mode === "hard" ? [0, 2, 4, 5] : [0, 1, 2, 3, 4, 5, 6];

  return schedule
    .map((unlockAt, index) => ({ unlockAt, clue: ladder[index] }))
    .filter(({ unlockAt, clue }) => clue && guessCount >= unlockAt)
    .map(({ clue }) => clue);
}

export function toCipherwordRoundResult(state: CipherwordRoundState): CipherwordRoundResult {
  return {
    puzzleId: state.puzzleId,
    mode: state.mode,
    dateKey: state.dateKey ?? state.puzzleId,
    category: state.puzzle.category,
    solved: state.status === "won",
    guesses: state.guesses,
    maxGuesses: state.maxGuesses,
    answer: state.puzzle.answer,
    learn: state.puzzle.learn,
  };
}

export function getCipherwordDailyNumber(dateKey: string) {
  return getCipherwordDailyIndex(dateKey) + 1;
}

export function getMaxGuesses(mode: CipherwordMode) {
  if (mode === "hard") return 6;
  if (mode === "zen") return null;
  return 7;
}

export function getVisibleScore(guess: CipherwordGuessResult, mode: CipherwordMode) {
  return mode === "hard" && guess.score < 100 ? null : guess.score;
}

function withError(state: CipherwordRoundState, error: string): CipherwordRoundState {
  return {
    ...state,
    error,
    message: error,
  };
}

function getClosestGuess(guesses: CipherwordGuessResult[]) {
  return guesses
    .filter((guess) => !guess.isExact)
    .sort((left, right) => right.score - left.score)[0];
}

function getNewestUnlockedClue(state: CipherwordRoundState) {
  const clues = getUnlockedClues(state);
  const previousState = {
    ...state,
    guesses: state.guesses.slice(0, -1),
  };
  const previousIds = new Set(getUnlockedClues(previousState).map((clue) => clue.id));

  return clues.find((clue) => !previousIds.has(clue.id));
}

function getClueLadder(puzzle: CipherwordPuzzle): CipherwordClue[] {
  const shape = getAnswerShape(puzzle.answer);
  const first = normalizeAnswer(puzzle.answer).slice(0, 1).toUpperCase();
  const last = normalizeAnswer(puzzle.answer).slice(-1).toUpperCase();
  const custom = puzzle.clueLadder ?? [];
  const defaults = [
    `Shape ${shape}; category ${formatCategory(puzzle.category)}.`,
    custom[0] ?? `Broad domain: ${puzzle.tags.slice(0, 2).join(" and ")}.`,
    custom[1] ?? `Often near: ${puzzle.near.slice(0, 2).join(", ")}.`,
    custom[2] ?? "Use your closest guess: move toward the shared idea, not just the letters.",
    custom[3] ?? `First letter: ${first}.`,
    custom[4] ?? `First and last letters: ${first} ... ${last}.`,
    custom[5] ?? puzzle.definition,
  ];

  return defaults.map((text, index) => ({
    id: `clue-${index + 1}`,
    label: index === 0 ? "Start" : `Clue ${index}`,
    text,
  }));
}

function formatCategory(category: string) {
  return category.slice(0, 1).toUpperCase() + category.slice(1);
}
