export type GameStatus = "playable" | "coming-soon";

export type GameGenre =
  | "Action"
  | "Adventure"
  | "Casual"
  | "Family"
  | "Puzzle"
  | "Racing"
  | "Simulation"
  | "Sports"
  | "Strategy"
  | "Word";

export type GameAccent = "green" | "blue" | "amber" | "violet" | "slate" | "teal";

export type GamePreviewKind =
  | "snake"
  | "minesweeper"
  | "pong"
  | "tiles"
  | "orbit"
  | "number"
  | "dashline"
  | "sky-courier"
  | "word"
  | "stack"
  | "garden"
  | "route";

export type GameDefinition = {
  slug: string;
  title: string;
  genre: GameGenre;
  status: GameStatus;
  summary: string;
  description: string;
  accent: GameAccent;
  preview: GamePreviewKind;
  priority: number;
};
