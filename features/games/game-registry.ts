import type { GameDefinition } from "./types";

export const games = [
  {
    slug: "snake",
    title: "Snake",
    genre: "Action",
    status: "playable",
    summary: "Guide the snake, chain apples, and beat your best run.",
    description: "A polished arcade classic rebuilt around clean turns and quick restarts.",
    accent: "green",
    preview: "snake",
    priority: 1,
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
