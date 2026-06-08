import type { TileState } from "./letter-feedback";
import type { CipherwordCategory, CipherwordPuzzle } from "./puzzles";

export const cipherwordModes = ["daily", "archive", "unlimited", "hard", "zen"] as const;

export type CipherwordMode = (typeof cipherwordModes)[number];
export type CipherwordRoundStatus = "playing" | "won" | "lost" | "unavailable";
export type SemanticTier = "Ice cold" | "Cold" | "Warm" | "Hot" | "Very hot" | "Burning" | "Solved";

export type CipherwordClue = {
  id: string;
  label: string;
  text: string;
};

export type CipherwordScore = {
  score: number;
  tier: SemanticTier;
  hint: string;
  reasons: string[];
};

export type CipherwordGuessResult = CipherwordScore & {
  id: string;
  guess: string;
  normalizedGuess: string;
  isExact: boolean;
  tileStates: TileState[];
  answerShape: string;
  clue?: CipherwordClue;
};

export type CipherwordRoundState = {
  puzzle: CipherwordPuzzle;
  mode: CipherwordMode;
  puzzleId: string;
  dateKey?: string;
  status: CipherwordRoundStatus;
  maxGuesses: number | null;
  guesses: CipherwordGuessResult[];
  closestGuess?: CipherwordGuessResult;
  message?: string;
  error?: string;
  bankExhausted?: boolean;
  startedAt: string;
  finishedAt?: string;
};

export type CipherwordSettings = {
  hardMode: boolean;
  highContrast: boolean;
  reducedMotionOverride?: boolean;
};

export type CipherwordCompletedPuzzle = {
  puzzleId: string;
  mode: CipherwordMode;
  dateKey: string;
  solved: boolean;
  guesses: string[];
  scores: number[];
};

export type CipherwordStats = {
  version: number;
  daily: {
    solvedDates: string[];
    currentStreak: number;
    bestStreak: number;
    lastPlayedDate?: string;
    lastSolvedDate?: string;
  };
  archive: {
    solvedDates: string[];
  };
  totals: {
    played: number;
    solved: number;
    losses: number;
    currentUnlimitedRun: number;
    bestUnlimitedRun: number;
  };
  guessDistribution: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, number>;
  categorySolves: Record<CipherwordCategory, number>;
  achievements: Record<string, { unlockedAt?: string; progress?: number }>;
  settings: CipherwordSettings;
  completedPuzzles: Record<string, CipherwordCompletedPuzzle>;
};

export type CipherwordRoundResult = {
  puzzleId: string;
  mode: CipherwordMode;
  dateKey: string;
  category: CipherwordCategory;
  solved: boolean;
  guesses: CipherwordGuessResult[];
  maxGuesses: number | null;
  answer: string;
  learn: string;
};

export type AchievementUnlock = {
  id: string;
  name: string;
};
