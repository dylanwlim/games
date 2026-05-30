import type { GameDefinition } from "./types";

export const games = [
  {
    slug: "snake",
    title: "Snake",
    genre: "Action",
    status: "playable",
    summary: "Classic movement, tight controls, clean canvas.",
    description:
      "A focused starter game with keyboard controls, touch controls, speed settings, and local best score.",
    accent: "green",
    preview: "snake",
    priority: 1,
  },
  {
    slug: "minesweeper",
    title: "Minesweeper",
    genre: "Puzzle",
    status: "coming-soon",
    summary: "A quiet grid puzzle shell reserved for the next playable build.",
    description:
      "The placeholder is intentionally finished so the hub can ship before this game is playable.",
    accent: "blue",
    preview: "minesweeper",
    priority: 2,
  },
  {
    slug: "pong",
    title: "Pong",
    genre: "Sports",
    status: "coming-soon",
    summary: "Minimal rallies and quick rounds for a future arcade slot.",
    description: "A planned lightweight arcade game with keyboard and touch-friendly controls.",
    accent: "slate",
    preview: "pong",
    priority: 3,
  },
  {
    slug: "tiles",
    title: "Tiles",
    genre: "Puzzle",
    status: "coming-soon",
    summary: "A future falling-block puzzle with crisp, readable pieces.",
    description: "Reserved for a polished puzzle loop once the core hub is stable.",
    accent: "violet",
    preview: "tiles",
    priority: 4,
  },
  {
    slug: "orbit",
    title: "Orbit",
    genre: "Adventure",
    status: "coming-soon",
    summary: "A small timing game planned around simple orbital motion.",
    description: "A calm precision game concept for a later release.",
    accent: "teal",
    preview: "orbit",
    priority: 5,
  },
  {
    slug: "2048",
    title: "2048",
    genre: "Puzzle",
    status: "coming-soon",
    summary: "A compact number puzzle placeholder for the registry.",
    description: "A future implementation target once the hub has more playable games.",
    accent: "amber",
    preview: "path",
    priority: 6,
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
