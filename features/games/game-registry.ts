import type { GameDefinition } from "./types";

export const games = [
  {
    slug: "meadow",
    title: "Meadow",
    genre: "Strategy",
    status: "playable",
    summary: "Build an outpost, race scarce spawns, and bank the land rush.",
    description:
      "A contested production game about turning a small meadow claim into a stable shared outpost.",
    accent: "amber",
    preview: "meadow",
    priority: 1,
    duration: "3-min shifts",
    tags: ["Strategy", "Production", "Co-op", "Land rush"],
  },
  {
    slug: "snake",
    title: "Snake",
    genre: "Action",
    status: "playable",
    summary: "Guide the snake, chain apples, and beat your best run.",
    description: "A polished arcade classic rebuilt around clean turns and quick restarts.",
    accent: "green",
    preview: "snake",
    priority: 2,
    duration: "1-min rounds",
    tags: ["Arcade", "Classic", "Blitz", "Zen"],
  },
] satisfies GameDefinition[];

export type GameSlug = (typeof games)[number]["slug"];

export const playableGames = games.filter((game) => game.status === "playable");

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug);
}

export function isGameSlug(slug: string): slug is GameSlug {
  return games.some((game) => game.slug === slug);
}
