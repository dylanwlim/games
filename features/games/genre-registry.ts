import type { GameGenre } from "./types";

export const gameGenres = [
  {
    slug: "action",
    label: "Action",
    icon: "zap",
  },
  {
    slug: "adventure",
    label: "Adventure",
    icon: "map",
  },
  {
    slug: "casual",
    label: "Casual",
    icon: "gamepad",
  },
  {
    slug: "family",
    label: "Family",
    icon: "users",
  },
  {
    slug: "puzzle",
    label: "Puzzle",
    icon: "puzzle",
  },
  {
    slug: "racing",
    label: "Racing",
    icon: "flag",
  },
  {
    slug: "simulation",
    label: "Simulation",
    icon: "boxes",
  },
  {
    slug: "sports",
    label: "Sports",
    icon: "trophy",
  },
  {
    slug: "strategy",
    label: "Strategy",
    icon: "map",
  },
  {
    slug: "word",
    label: "Word",
    icon: "type",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  label: GameGenre;
  icon: string;
}>;

export type GenreSlug = (typeof gameGenres)[number]["slug"];

export function getGenreBySlug(slug: string) {
  return gameGenres.find((genre) => genre.slug === slug);
}

export function isGenreSlug(slug: string): slug is GenreSlug {
  return gameGenres.some((genre) => genre.slug === slug);
}
