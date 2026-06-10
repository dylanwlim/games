export type GameStatus = "playable";

export type GameGenre = "Action" | "Strategy";

export type GameAccent = "green" | "amber";

export type GamePreviewKind = "meadow" | "snake";

export type GameDefinition = {
  accent: GameAccent;
  description: string;
  duration?: string;
  genre: GameGenre;
  preview: GamePreviewKind;
  priority: number;
  slug: string;
  status: GameStatus;
  summary: string;
  tags?: string[];
  title: string;
};
