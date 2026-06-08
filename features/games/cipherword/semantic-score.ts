import { normalizeAnswer, normalizeDisplay } from "./normalize";
import { CIPHERWORD_SEED_PUZZLES, type CipherwordCategory, type CipherwordPuzzle } from "./puzzles";
import type { CipherwordScore, SemanticTier } from "./types";

export type CipherwordLexiconEntry = {
  category: CipherwordCategory;
  tags: string[];
};

export type CipherwordLexicon = Map<string, CipherwordLexiconEntry>;

export const cipherwordLexicon = createCipherwordLexicon();

export function createCipherwordLexicon(puzzles = CIPHERWORD_SEED_PUZZLES): CipherwordLexicon {
  const lexicon: CipherwordLexicon = new Map();

  puzzles.forEach((puzzle) => {
    const terms = [puzzle.answer, ...puzzle.aliases, ...puzzle.near, ...puzzle.tags];

    terms.forEach((term) => {
      const key = normalizeDisplay(term);

      if (!key) {
        return;
      }

      const current = lexicon.get(key);
      const tags = Array.from(new Set([...(current?.tags ?? []), ...puzzle.tags, puzzle.category]));

      lexicon.set(key, {
        category: current?.category ?? puzzle.category,
        tags,
      });
    });
  });

  return lexicon;
}

export function scoreGuess(
  guess: string,
  puzzle: CipherwordPuzzle,
  lexicon: CipherwordLexicon = cipherwordLexicon,
): CipherwordScore {
  if (isExactGuess(guess, puzzle)) {
    return {
      score: 100,
      tier: "Solved",
      hint: "Solved.",
      reasons: ["Exact match"],
    };
  }

  const normalizedGuess = normalizeDisplay(guess);
  const normalizedGuessLetters = normalizeAnswer(guess);
  const normalizedAnswer = normalizeAnswer(puzzle.answer);
  const directNearScore = getDirectNearScore(normalizedGuess, puzzle.near);
  const lexiconEntry = lexicon.get(normalizedGuess);
  const tagScore = getTagScore(lexiconEntry?.tags ?? getLooseTags(normalizedGuess), [
    ...puzzle.tags,
    puzzle.category,
  ]);
  const categoryScore = lexiconEntry?.category === puzzle.category ? 44 : 0;
  const letterScore = getLetterSimilarityScore(normalizedGuessLetters, normalizedAnswer);
  const scores = [directNearScore, tagScore, categoryScore, letterScore].sort((a, b) => b - a);
  const smallBlendBonus = Math.min(9, Math.floor((scores[1] ?? 0) / 10));
  const score = clamp(Math.round((scores[0] ?? 0) + smallBlendBonus), 0, 99);
  const tier = getSemanticTier(score);

  return {
    score,
    tier,
    hint: getHintForScore(score, directNearScore > 0),
    reasons: getReasons({ directNearScore, tagScore, categoryScore, letterScore, lexiconEntry }),
  };
}

export function getSemanticTier(score: number): SemanticTier {
  if (score >= 100) return "Solved";
  if (score >= 85) return "Burning";
  if (score >= 70) return "Very hot";
  if (score >= 55) return "Hot";
  if (score >= 40) return "Warm";
  if (score >= 20) return "Cold";
  return "Ice cold";
}

function isExactGuess(guess: string, puzzle: CipherwordPuzzle) {
  const normalizedGuess = normalizeAnswer(guess);
  const accepted = [puzzle.answer, ...puzzle.aliases].map(normalizeAnswer);

  return accepted.includes(normalizedGuess);
}

function getDirectNearScore(normalizedGuess: string, nearTerms: string[]) {
  const index = nearTerms.findIndex((nearTerm) => normalizeDisplay(nearTerm) === normalizedGuess);

  if (index < 0) {
    return 0;
  }

  return Math.max(70, 92 - index * 5);
}

function getTagScore(guessTags: string[], answerTags: string[]) {
  const guess = new Set(guessTags.map(normalizeDisplay).filter(Boolean));
  const answer = new Set(answerTags.map(normalizeDisplay).filter(Boolean));

  if (!guess.size || !answer.size) {
    return 0;
  }

  let overlap = 0;
  guess.forEach((tag) => {
    if (answer.has(tag)) overlap += 1;
  });

  return Math.round((overlap / Math.max(guess.size, answer.size)) * 72);
}

function getLooseTags(value: string) {
  return value.split(" ").filter((token) => token.length > 2);
}

function getLetterSimilarityScore(guess: string, answer: string) {
  if (!guess || !answer) {
    return 0;
  }

  const overlap = getDuplicateAwareOverlap(guess, answer) / Math.max(guess.length, answer.length);
  const dice = getBigramDice(guess, answer);
  const distance = getLevenshteinDistance(guess, answer);
  const levenshtein = 1 - distance / Math.max(guess.length, answer.length);

  return Math.round(Math.max(overlap, dice, levenshtein) * 28);
}

function getDuplicateAwareOverlap(source: string, target: string) {
  const counts = new Map<string, number>();
  let overlap = 0;

  target.split("").forEach((letter) => counts.set(letter, (counts.get(letter) ?? 0) + 1));
  source.split("").forEach((letter) => {
    const count = counts.get(letter) ?? 0;

    if (count > 0) {
      overlap += 1;
      counts.set(letter, count - 1);
    }
  });

  return overlap;
}

function getBigramDice(source: string, target: string) {
  const sourceBigrams = getBigrams(source);
  const targetBigrams = getBigrams(target);

  if (!sourceBigrams.length || !targetBigrams.length) {
    return source === target ? 1 : 0;
  }

  const counts = new Map<string, number>();
  let overlap = 0;

  targetBigrams.forEach((bigram) => counts.set(bigram, (counts.get(bigram) ?? 0) + 1));
  sourceBigrams.forEach((bigram) => {
    const count = counts.get(bigram) ?? 0;

    if (count > 0) {
      overlap += 1;
      counts.set(bigram, count - 1);
    }
  });

  return (2 * overlap) / (sourceBigrams.length + targetBigrams.length);
}

function getBigrams(value: string) {
  if (value.length < 2) {
    return [];
  }

  return Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2));
}

function getLevenshteinDistance(source: string, target: string) {
  const distances = Array.from({ length: source.length + 1 }, () =>
    Array<number>(target.length + 1).fill(0),
  );

  for (let sourceIndex = 0; sourceIndex <= source.length; sourceIndex += 1) {
    distances[sourceIndex][0] = sourceIndex;
  }

  for (let targetIndex = 0; targetIndex <= target.length; targetIndex += 1) {
    distances[0][targetIndex] = targetIndex;
  }

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;

      distances[sourceIndex][targetIndex] = Math.min(
        distances[sourceIndex - 1][targetIndex] + 1,
        distances[sourceIndex][targetIndex - 1] + 1,
        distances[sourceIndex - 1][targetIndex - 1] + substitutionCost,
      );
    }
  }

  return distances[source.length][target.length];
}

function getHintForScore(score: number, directNear: boolean) {
  if (score >= 85) return "Burning. Try the exact word or use letter clues.";
  if (score >= 70) return directNear ? "Very close. Adjust the angle." : "Very close.";
  if (score >= 55) return "Hot. Same concept area; refine the idea.";
  if (score >= 40) return "Warm. Related broad area, not the target word.";
  if (score >= 20) return "Cold. Try a stronger connection to the clue category.";
  return "Far from the answer's meaning. Try language, codes, writing, speech, or symbols.";
}

function getReasons({
  directNearScore,
  tagScore,
  categoryScore,
  letterScore,
  lexiconEntry,
}: {
  directNearScore: number;
  tagScore: number;
  categoryScore: number;
  letterScore: number;
  lexiconEntry?: CipherwordLexiconEntry;
}) {
  const reasons: string[] = [];

  if (directNearScore) reasons.push("near term");
  if (tagScore >= 20) reasons.push("shared tags");
  if (categoryScore) reasons.push(`${lexiconEntry?.category ?? "same"} category`);
  if (letterScore >= 14) reasons.push("letter shape");

  return reasons.length ? reasons : ["low signal"];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
