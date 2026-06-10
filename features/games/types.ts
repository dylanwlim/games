export type GameStatus = "playable";

export type GameGenre = "Action";

export type GameAccent = "green";

export type GamePreviewKind = "snake";

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
