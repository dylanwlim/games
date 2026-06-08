import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../features/games/cipherword/daily-answers.ts", import.meta.url),
  "utf8",
);
const match = source.match(/export const CIPHERWORD_DAILY_ANSWERS = \[([\s\S]*?)\] as const;/);
if (!match) throw new Error("CIPHERWORD_DAILY_ANSWERS not found");
const answers = [...match[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
const start = Date.UTC(2026, 5, 1);
const end = Date.UTC(2050, 11, 31);
const expected = Math.floor((end - start) / 86_400_000) + 1;
if (answers.length !== expected)
  throw new Error(`Expected ${expected} answers, found ${answers.length}`);
const seen = new Set(answers);
if (seen.size !== answers.length)
  throw new Error(`Duplicate answer count: ${answers.length - seen.size}`);
for (const answer of answers) {
  if (!/^[a-z]{4,10}$/.test(answer)) throw new Error(`Invalid answer: ${answer}`);
}
console.log(
  `Cipherword daily bank valid: ${answers.length} unique answers, 2026-06-01 through 2050-12-31.`,
);
