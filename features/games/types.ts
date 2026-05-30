export type GameStatus = "playable" | "coming-soon";

export type GameGenre = "Classic" | "Logic" | "Arcade" | "Puzzle" | "Focus";

export type GameAccent = "green" | "blue" | "amber" | "violet" | "slate" | "teal";

export type GamePreviewKind = "snake" | "minesweeper" | "pong" | "tiles" | "orbit" | "path";

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
