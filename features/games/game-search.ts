import { gameGenres, getGenreBySlug, type GenreSlug } from "./genre-registry";
import type { GameDefinition } from "./types";

const ignoredSearchTokens = new Set(["game", "games", "genre", "genres", "category"]);

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getSearchTokens(value: string) {
  const normalized = normalizeSearchText(value);

  return normalized ? normalized.split(/\s+/) : [];
}

function getMeaningfulSearchTokens(value: string) {
  const tokens = getSearchTokens(value);
  const meaningfulTokens = tokens.filter((token) => !ignoredSearchTokens.has(token));

  return meaningfulTokens.length ? meaningfulTokens : tokens;
}

function getGameSearchTokens(game: GameDefinition) {
  const statusText =
    game.status === "playable"
      ? "playable live released out available"
      : "coming soon upcoming unreleased in progress planned disabled";

  return getSearchTokens(
    `${game.title} ${game.slug} ${game.genre} ${game.summary} ${game.description} ${statusText}`,
  );
}

function getAllowedDistance(queryToken: string, targetToken: string) {
  const length = Math.min(queryToken.length, targetToken.length);

  if (length <= 2) {
    return 0;
  }

  if (length <= 6) {
    return 2;
  }

  return 3;
}

function tokenMatchesTarget(queryToken: string, targetToken: string) {
  if (queryToken === targetToken) {
    return true;
  }

  if (queryToken.length >= 3 && targetToken.includes(queryToken)) {
    return true;
  }

  if (targetToken.length >= 3 && queryToken.includes(targetToken)) {
    return true;
  }

  if (queryToken.length >= 4 && targetToken.startsWith(queryToken.slice(0, -1))) {
    return true;
  }

  if (queryToken.length <= 2 || targetToken.length <= 2) {
    return false;
  }

  return getEditDistance(queryToken, targetToken) <= getAllowedDistance(queryToken, targetToken);
}

function queryMatchesTargets(query: string, targets: string[]) {
  const queryTokens = getMeaningfulSearchTokens(query);

  if (!queryTokens.length) {
    return true;
  }

  const targetTokens = targets.flatMap((target) => getSearchTokens(target));

  return queryTokens.every((queryToken) =>
    targetTokens.some((targetToken) => tokenMatchesTarget(queryToken, targetToken)),
  );
}

export function getSearchGenre(searchQuery: string): GenreSlug | undefined {
  const queryTokens = getMeaningfulSearchTokens(searchQuery);

  if (queryTokens.length !== 1) {
    return undefined;
  }

  const [queryToken] = queryTokens;

  return gameGenres.find((genre) =>
    getSearchTokens(`${genre.label} ${genre.slug}`).some((genreToken) =>
      tokenMatchesTarget(queryToken, genreToken),
    ),
  )?.slug;
}

export function matchesGameSearch(game: GameDefinition, searchQuery: string) {
  const queryTokens = getMeaningfulSearchTokens(searchQuery);

  if (!queryTokens.length) {
    return true;
  }

  const searchGenre = getSearchGenre(searchQuery);

  if (searchGenre && getGenreBySlug(searchGenre)?.label === game.genre) {
    return true;
  }

  return queryMatchesTargets(searchQuery, getGameSearchTokens(game));
}

export function filterGamesBySearch(
  gameList: GameDefinition[],
  searchQuery: string,
  activeGenre?: GenreSlug,
) {
  const queryTokens = getMeaningfulSearchTokens(searchQuery);
  const searchGenre = getSearchGenre(searchQuery);
  const effectiveGenre = searchGenre ?? activeGenre;
  const activeGenreLabel = effectiveGenre ? getGenreBySlug(effectiveGenre)?.label : undefined;

  return gameList.filter((game) => {
    if (activeGenreLabel && game.genre !== activeGenreLabel) {
      return false;
    }

    if (!queryTokens.length) {
      return true;
    }

    if (searchGenre && game.genre === activeGenreLabel) {
      return true;
    }

    return matchesGameSearch(game, searchQuery);
  });
}

function getEditDistance(source: string, target: string) {
  const distances = Array.from({ length: source.length + 1 }, () =>
    Array<number>(target.length + 1).fill(0),
  );

  for (let sourceIndex = 0; sourceIndex <= source.length; sourceIndex += 1) {
    distances[sourceIndex][0] = sourceIndex;
  }

  for (let targetIndex = 0; targetIndex <= target.length; targetIndex += 1) {
    distances[0][targetIndex] = targetIndex;
  }

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const substitutionCost = source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1;

      distances[sourceIndex][targetIndex] = Math.min(
        distances[sourceIndex - 1][targetIndex] + 1,
        distances[sourceIndex][targetIndex - 1] + 1,
        distances[sourceIndex - 1][targetIndex - 1] + substitutionCost,
      );

      if (
        sourceIndex > 1 &&
        targetIndex > 1 &&
        source[sourceIndex - 1] === target[targetIndex - 2] &&
        source[sourceIndex - 2] === target[targetIndex - 1]
      ) {
        distances[sourceIndex][targetIndex] = Math.min(
          distances[sourceIndex][targetIndex],
          distances[sourceIndex - 2][targetIndex - 2] + 1,
        );
      }
    }
  }

  return distances[source.length][target.length];
}
