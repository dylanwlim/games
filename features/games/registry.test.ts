import { describe, expect, it } from "vitest";

import { games, getGameBySlug, playableGames } from "./game-registry";

describe("game registry", () => {
  it("has unique slugs", () => {
    const slugs = games.map((game) => game.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps playable games registered in launch order", () => {
    expect(playableGames).toHaveLength(2);
    expect(playableGames.map((game) => game.slug)).toEqual(["meadow", "snake"]);
    expect(getGameBySlug("meadow")?.status).toBe("playable");
    expect(getGameBySlug("snake")?.status).toBe("playable");
  });

  it("keeps deleted games out of the active registry", () => {
    expect(getGameBySlug("cipher")).toBeUndefined();
    expect(games).toHaveLength(2);
  });
});
