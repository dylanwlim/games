import { describe, expect, it } from "vitest";

import { filterGamesBySearch, getSearchGenre } from "./game-search";
import { games } from "./game-registry";

function titlesFor(query: string, activeGenre?: Parameters<typeof filterGamesBySearch>[2]) {
  return filterGamesBySearch(games, query, activeGenre).map((game) => game.title);
}

describe("game search", () => {
  it("matches games with likely misspellings", () => {
    expect(titlesFor("snkae")).toEqual(["Snake"]);
    expect(titlesFor("minesweepr")).toEqual(["Minesweeper"]);
  });

  it("matches fuzzy category searches and returns the whole category", () => {
    expect(getSearchGenre("puzle games")).toBe("puzzle");
    expect(titlesFor("puzle games")).toEqual(["Minesweeper", "Tiles", "2048"]);
  });

  it("lets an explicit category search override the active category filter", () => {
    expect(titlesFor("puzl", "action")).toEqual(["Minesweeper", "Tiles", "2048"]);
    expect(titlesFor("snake", "puzzle")).toEqual([]);
  });

  it("finds unreleased games with in-progress language", () => {
    expect(titlesFor("in progress")).toEqual(games.slice(1).map((game) => game.title));
  });
});
