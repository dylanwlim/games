export const cipherwordAchievements = [
  { id: "first-signal", name: "First Signal", condition: "Solve one Cipherword." },
  { id: "three-streak", name: "Three-Day Thread", condition: "Solve 3 daily puzzles in a row." },
  { id: "seven-streak", name: "Signal Week", condition: "Solve 7 daily puzzles in a row." },
  { id: "thirty-streak", name: "Monthly Cipher", condition: "Solve 30 daily puzzles in a row." },
  { id: "third-guess", name: "Sharp Read", condition: "Solve in 3 guesses or fewer." },
  { id: "final-guess", name: "Last Word", condition: "Solve on the final allowed guess." },
  {
    id: "no-hot-needed",
    name: "Cold Start",
    condition: "Solve after first guess scored Cold or Ice Cold.",
  },
  {
    id: "burning-path",
    name: "Burning Path",
    condition: "Make two Burning guesses before solving.",
  },
  {
    id: "category-scout",
    name: "Category Scout",
    condition: "Solve puzzles in 5 categories.",
  },
  { id: "semanticist", name: "Semanticist", condition: "Solve 25 total puzzles." },
  { id: "hard-mode-clear", name: "Hard Read", condition: "Win Hard mode." },
  {
    id: "daily-return",
    name: "Back Tomorrow",
    condition: "Open Cipherword on two consecutive days.",
  },
  { id: "time-traveler", name: "Time Traveler", condition: "Solve one archive puzzle." },
  { id: "backfill", name: "Backfill", condition: "Solve 7 archive puzzles." },
  {
    id: "calendar-sweep",
    name: "Calendar Sweep",
    condition: "Solve every available puzzle in a month.",
  },
  { id: "launch-week", name: "Launch Week", condition: "Solve June 1-7, 2026." },
  { id: "historian", name: "Historian", condition: "Solve 100 archive puzzles." },
] as const;

export type CipherwordAchievementId = (typeof cipherwordAchievements)[number]["id"];
