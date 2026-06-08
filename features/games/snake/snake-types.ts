export type Direction = "up" | "right" | "down" | "left";

export type Point = {
  x: number;
  y: number;
};

export const snakeModes = ["classic", "blitz", "zen"] as const;

export type SnakeMode = (typeof snakeModes)[number];

export type SnakeStatus = "ready" | "playing" | "paused" | "game-over";

export type SnakeLastEvent = "none" | "ate" | "hit-wall" | "hit-self" | "time-up" | "cleared";

export type SnakeModeDefinition = {
  label: string;
  description: string;
  baseSpeedMs: number;
  minSpeedMs: number;
  speedStepMs: number;
  scorePerFood: number;
  wrapsWalls: boolean;
  durationMs: number | null;
};

export type SnakeState = {
  boardSize: number;
  mode: SnakeMode;
  snake: Point[];
  previousSnake: Point[];
  food: Point | null;
  direction: Direction;
  queuedDirections: Direction[];
  status: SnakeStatus;
  score: number;
  foodsEaten: number;
  scoreStreak: number;
  lastScoreDelta: number;
  tick: number;
  speedMs: number;
  elapsedMs: number;
  durationMs: number | null;
  lastEvent: SnakeLastEvent;
};
