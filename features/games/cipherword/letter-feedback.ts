import { normalizeAnswer } from "./normalize";

export type TileState = "correct" | "present" | "absent" | "empty";

export function getLetterFeedback(guess: string, answer: string): TileState[] {
  const guessLetters = normalizeAnswer(guess).split("");
  const answerLetters = normalizeAnswer(answer).split("");

  if (guessLetters.length !== answerLetters.length) {
    return [];
  }

  const result: TileState[] = Array<TileState>(guessLetters.length).fill("absent");
  const remaining = new Map<string, number>();

  answerLetters.forEach((letter, index) => {
    if (guessLetters[index] === letter) {
      result[index] = "correct";
      return;
    }

    remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  });

  guessLetters.forEach((letter, index) => {
    if (result[index] === "correct") {
      return;
    }

    const count = remaining.get(letter) ?? 0;

    if (count > 0) {
      result[index] = "present";
      remaining.set(letter, count - 1);
    }
  });

  return result;
}
