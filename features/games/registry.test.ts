import { describe, expect, it } from "vitest";

import { games, getGameBySlug, playableGames } from "./game-registry";

describe("game registry", () => {
  it("has unique slugs", () => {
    const slugs = games.map((game) => game.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps Snake as the first playable game", () => {
    expect(playableGames).toHaveLength(1);
    expect(playableGames[0]?.slug).toBe("snake");
    expect(getGameBySlug("snake")?.status).toBe("playable");
  });

  it("keeps placeholder games visibly unavailable", () => {
    expect(games.filter((game) => game.status === "coming-soon").length).toBeGreaterThan(0);
  });
});
