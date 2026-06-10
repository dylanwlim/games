import type { SnakeMode } from "@/features/games/snake/snake-types";

export const progressionStorageKey = "games:progression-v1";

export type ProgressionGameId = "snake";

export type AchievementDefinition = {
  description: string;
  gameId: ProgressionGameId | "global";
  id: string;
  title: string;
  xp: number;
};

export type AchievementState = {
  unlockedAt: string;
  xp: number;
};

export type SnakeProgression = {
  bestScore: number;
  completedRuns: number;
  foodEaten: number;
  modesTried: SnakeMode[];
  xp: number;
};

export type GameProgression = {
  achievements: Record<string, AchievementState>;
  games: {
    snake: SnakeProgression;
  };
  level: number;
  totalXp: number;
  updatedAt: string | null;
  version: 1;
};

export type SnakeRunResult = {
  elapsedMs: number;
  foodsEaten: number;
  mode: SnakeMode;
  score: number;
};

export type ProgressionUpdate = {
  nextProgression: GameProgression;
  runXp: number;
  unlockedAchievements: AchievementDefinition[];
};

export const achievementDefinitions = [
  {
    id: "snake-first-run",
    gameId: "snake",
    title: "First Run",
    description: "Finish one Snake run.",
    xp: 25,
  },
  {
    id: "snake-first-apple",
    gameId: "snake",
    title: "First Apple",
    description: "Eat an apple in Snake.",
    xp: 35,
  },
  {
    id: "snake-score-100",
    gameId: "snake",
    title: "Triple Digits",
    description: "Score 100 or more in Snake.",
    xp: 75,
  },
  {
    id: "snake-mode-sampler",
    gameId: "snake",
    title: "Mode Sampler",
    description: "Complete a run in Classic, Blitz, and Zen.",
    xp: 100,
  },
  {
    id: "global-level-3",
    gameId: "global",
    title: "Arcade Regular",
    description: "Reach level 3 across all games.",
    xp: 125,
  },
] satisfies AchievementDefinition[];

export function createInitialProgression(): GameProgression {
  return {
    achievements: {},
    games: {
      snake: {
        bestScore: 0,
        completedRuns: 0,
        foodEaten: 0,
        modesTried: [],
        xp: 0,
      },
    },
    level: 1,
    totalXp: 0,
    updatedAt: null,
    version: 1,
  };
}

export function parseProgression(rawProgression: string | null): GameProgression {
  if (!rawProgression) {
    return createInitialProgression();
  }

  try {
    return normalizeProgression(JSON.parse(rawProgression));
  } catch {
    return createInitialProgression();
  }
}

export function recordSnakeRun(
  progression: GameProgression,
  run: SnakeRunResult,
  now = new Date(),
): ProgressionUpdate {
  const current = normalizeProgression(progression);
  const runXp = computeSnakeRunXp(run);
  const modesTried = Array.from(new Set([...current.games.snake.modesTried, run.mode]));
  const snake: SnakeProgression = {
    bestScore: Math.max(current.games.snake.bestScore, Math.max(0, Math.floor(run.score))),
    completedRuns: current.games.snake.completedRuns + 1,
    foodEaten: current.games.snake.foodEaten + Math.max(0, Math.floor(run.foodsEaten)),
    modesTried,
    xp: current.games.snake.xp + runXp,
  };
  const withoutAchievements: GameProgression = {
    ...current,
    games: {
      ...current.games,
      snake,
    },
    totalXp: current.totalXp + runXp,
    updatedAt: now.toISOString(),
  };
  const withRunLevel = {
    ...withoutAchievements,
    level: getLevelForXp(withoutAchievements.totalXp),
  };
  const { achievements, achievementXp, unlockedAchievements } = unlockEligibleAchievements(
    withRunLevel,
    now,
  );
  const totalXp = withRunLevel.totalXp + achievementXp;
  const nextProgression = {
    ...withRunLevel,
    achievements,
    level: getLevelForXp(totalXp),
    totalXp,
  };

  return {
    nextProgression,
    runXp,
    unlockedAchievements,
  };
}

export function computeSnakeRunXp(run: SnakeRunResult) {
  const scoreXp = Math.floor(Math.max(0, run.score) / 2);
  const foodXp = Math.max(0, Math.floor(run.foodsEaten)) * 8;
  const completionXp = run.elapsedMs > 0 || run.score > 0 || run.foodsEaten > 0 ? 12 : 5;

  return Math.min(300, completionXp + scoreXp + foodXp);
}

export function getLevelForXp(totalXp: number) {
  let level = 1;

  while (getXpForLevel(level + 1) <= totalXp) {
    level += 1;
  }

  return level;
}

export function getXpForLevel(level: number) {
  if (level <= 1) {
    return 0;
  }

  const completedLevels = level - 1;
  return completedLevels * 100 + ((completedLevels - 1) * completedLevels * 50) / 2;
}

export function getLevelProgress(totalXp: number) {
  const level = getLevelForXp(totalXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const earnedThisLevel = totalXp - currentLevelXp;
  const neededThisLevel = nextLevelXp - currentLevelXp;

  return {
    earnedThisLevel,
    level,
    neededThisLevel,
    nextLevelXp,
    progress: neededThisLevel === 0 ? 1 : earnedThisLevel / neededThisLevel,
  };
}

function normalizeProgression(value: unknown): GameProgression {
  const input = value && typeof value === "object" ? (value as Partial<GameProgression>) : {};
  const initial = createInitialProgression();
  const achievements =
    input.achievements && typeof input.achievements === "object" ? input.achievements : {};
  const snakeInput =
    input.games?.snake && typeof input.games.snake === "object"
      ? (input.games.snake as Partial<SnakeProgression>)
      : {};
  const totalXp = normalizeNumber(input.totalXp);

  return {
    achievements: Object.fromEntries(
      Object.entries(achievements).flatMap(([id, state]) => {
        if (!state || typeof state !== "object") {
          return [];
        }

        const achievementState = state as Partial<AchievementState>;
        const unlockedAt =
          typeof achievementState.unlockedAt === "string"
            ? achievementState.unlockedAt
            : new Date(0).toISOString();

        return [
          [
            id,
            {
              unlockedAt,
              xp: normalizeNumber(achievementState.xp),
            },
          ],
        ];
      }),
    ),
    games: {
      snake: {
        bestScore: normalizeNumber(snakeInput.bestScore),
        completedRuns: normalizeNumber(snakeInput.completedRuns),
        foodEaten: normalizeNumber(snakeInput.foodEaten),
        modesTried: normalizeSnakeModes(snakeInput.modesTried),
        xp: normalizeNumber(snakeInput.xp),
      },
    },
    level: getLevelForXp(totalXp),
    totalXp,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : initial.updatedAt,
    version: 1,
  };
}

function unlockEligibleAchievements(progression: GameProgression, now: Date) {
  let achievementXp = 0;
  const achievements = { ...progression.achievements };
  const unlockedAchievements: AchievementDefinition[] = [];

  for (const definition of achievementDefinitions) {
    if (achievements[definition.id] || !isAchievementEligible(definition.id, progression)) {
      continue;
    }

    achievements[definition.id] = {
      unlockedAt: now.toISOString(),
      xp: definition.xp,
    };
    achievementXp += definition.xp;
    unlockedAchievements.push(definition);
  }

  return {
    achievementXp,
    achievements,
    unlockedAchievements,
  };
}

function isAchievementEligible(id: string, progression: GameProgression) {
  const { snake } = progression.games;

  if (id === "snake-first-run") {
    return snake.completedRuns >= 1;
  }

  if (id === "snake-first-apple") {
    return snake.foodEaten >= 1;
  }

  if (id === "snake-score-100") {
    return snake.bestScore >= 100;
  }

  if (id === "snake-mode-sampler") {
    return snake.modesTried.length >= 3;
  }

  if (id === "global-level-3") {
    return progression.totalXp >= getXpForLevel(3);
  }

  return false;
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeSnakeModes(value: unknown): SnakeMode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (mode): mode is SnakeMode => mode === "classic" || mode === "blitz" || mode === "zen",
  );
}
