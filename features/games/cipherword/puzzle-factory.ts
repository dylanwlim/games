import {
  CIPHERWORD_DAILY_ANSWERS,
  getCanonicalCipherwordDate,
  getCipherwordDailyAnswerForDate,
  getCipherwordPuzzleIdForDate,
} from "./daily-answers";
import { getAnswerShape, normalizeAnswer, normalizeDisplay } from "./normalize";
import {
  CIPHERWORD_CATEGORIES,
  CIPHERWORD_SEED_PUZZLES,
  type CipherwordCategory,
  type CipherwordDifficulty,
  type CipherwordPuzzle,
} from "./puzzles";

const categoryNearTerms: Record<CipherwordCategory, string[]> = {
  technology: ["system", "signal", "code", "network", "interface"],
  finance: ["value", "risk", "market", "asset", "return"],
  science: ["pattern", "force", "matter", "change", "measure"],
  nature: ["earth", "growth", "water", "weather", "habitat"],
  strategy: ["choice", "pressure", "tradeoff", "plan", "position"],
  culture: ["story", "symbol", "ritual", "status", "memory"],
  language: ["word", "meaning", "phrase", "clue", "logic"],
  history: ["record", "power", "treaty", "empire", "archive"],
  design: ["shape", "structure", "surface", "rhythm", "pattern"],
};

const seededByAnswer = new Map(
  CIPHERWORD_SEED_PUZZLES.map((puzzle) => [normalizeAnswer(puzzle.answer), puzzle]),
);

export const cipherwordCuratedPuzzles = CIPHERWORD_SEED_PUZZLES;

export function getCipherwordPuzzleForAnswer(answer: string): CipherwordPuzzle {
  const normalized = normalizeAnswer(answer);
  const curated = seededByAnswer.get(normalized);

  return curated ?? createGeneratedPuzzle(answer);
}

export function getCipherwordPuzzleForDate(dateKey = getCanonicalCipherwordDate()) {
  const answer = getCipherwordDailyAnswerForDate(dateKey);

  return answer ? getCipherwordPuzzleForAnswer(answer) : null;
}

export function getRequiredCipherwordPuzzleForDate(dateKey: string) {
  const puzzle = getCipherwordPuzzleForDate(dateKey);

  if (!puzzle) {
    throw new RangeError(`Cipherword date out of range: ${dateKey}`);
  }

  return puzzle;
}

export function getCipherwordPuzzleIdForMode({
  mode,
  dateKey,
  answer,
  seed,
}: {
  mode: string;
  dateKey?: string;
  answer: string;
  seed?: number;
}) {
  if ((mode === "daily" || mode === "archive" || mode === "hard") && dateKey) {
    return getCipherwordPuzzleIdForDate(dateKey);
  }

  return `cipherword-${mode}-${normalizeAnswer(answer)}-${seed ?? 0}`;
}

export function getRandomCipherwordPuzzle(recentIds: string[] = [], seed = Date.now()) {
  const curated = cipherwordCuratedPuzzles.filter((puzzle) => !recentIds.includes(puzzle.id));
  const pool = curated.length ? curated : cipherwordCuratedPuzzles;
  const index = Math.abs(hashString(`${seed}:${recentIds.join("|")}`)) % pool.length;

  return pool[index] ?? getCipherwordPuzzleForAnswer(CIPHERWORD_DAILY_ANSWERS[0]);
}

function createGeneratedPuzzle(answer: string): CipherwordPuzzle {
  const display = normalizeDisplay(answer);
  const normalized = normalizeAnswer(answer);
  const category =
    CIPHERWORD_CATEGORIES[Math.abs(hashString(normalized)) % CIPHERWORD_CATEGORIES.length];
  const difficulty = getGeneratedDifficulty(normalized);
  const near = getGeneratedNearTerms(category, normalized);
  const readable = display || answer.toLowerCase();

  return {
    id: `cw-bank-${normalized}`,
    answer: readable,
    aliases: [],
    category,
    difficulty,
    tags: [category, "daily", "word", getLengthTag(normalized), readable.slice(0, 1)].filter(
      Boolean,
    ),
    near,
    definition: `A ${getAnswerShape(readable)}-letter daily word-bank answer.`,
    learn:
      "This entry comes from the long-range daily bank; use the semantic warmth, shape, and clue ladder to close in.",
  };
}

function getGeneratedDifficulty(answer: string): CipherwordDifficulty {
  if (answer.length <= 5) return 2;
  if (answer.length <= 8) return 3;
  return 4;
}

function getGeneratedNearTerms(category: CipherwordCategory, answer: string) {
  const base = categoryNearTerms[category];
  const shape = answer.length <= 5 ? "short" : answer.length >= 9 ? "long" : "medium";

  return [...base, shape].slice(0, 6);
}

function getLengthTag(answer: string) {
  if (answer.length <= 5) return "compact";
  if (answer.length >= 9) return "long";
  return "medium";
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
