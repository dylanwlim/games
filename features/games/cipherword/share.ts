import { getCipherwordDailyIndex } from "./daily-answers";
import type { CipherwordRoundResult } from "./types";

const routeUrl = "https://games.dylanwlim.com/games/cipher";

const tierGlyphs: Record<string, string> = {
  "Ice cold": "[--]",
  Cold: "[-]",
  Warm: "[~]",
  Hot: "[+]",
  "Very hot": "[++]",
  Burning: "[!]",
  Solved: "[ok]",
};

export function getShareText(result: CipherwordRoundResult) {
  const number =
    result.mode === "daily" || result.mode === "archive"
      ? ` #${String(getCipherwordDailyIndex(result.dateKey) + 1).padStart(3, "0")}`
      : "";
  const max = result.maxGuesses ?? "∞";
  const scoreLine = result.solved ? `${result.guesses.length}/${max}` : `X/${max}`;
  const tiers = result.guesses.map((guess) => guess.tier);
  const compactTiers = tiers.map((tier) => tierGlyphs[tier] ?? "[--]").join(" ");
  const best = result.guesses
    .filter((guess) => !guess.isExact)
    .sort((left, right) => right.score - left.score)[0];

  return [
    `Cipher${number} — ${scoreLine}`,
    tiers.length ? tiers.join(" → ") : "No guesses",
    compactTiers,
    best ? `Best hint: ${best.hint.toLowerCase()}` : "Best hint: solved",
    routeUrl,
  ].join("\n");
}
