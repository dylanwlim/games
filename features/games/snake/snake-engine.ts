import {
  snakeModes,
  type Direction,
  type Point,
  type SnakeMode,
  type SnakeModeDefinition,
  type SnakeState,
  type SnakeStatus,
} from "./snake-types";

const DEFAULT_BOARD_SIZE = 21;
const INITIAL_LENGTH = 5;
const MAX_BUFFERED_DIRECTIONS = 2;
const SCORE_STREAK_STEP = 3;
const SCORE_STREAK_BONUS = 2;
const SCORE_STREAK_BONUS_CAP = 30;
const SCORE_SPEED_BONUS_STEP_MS = 10;

export const snakeModeDefinitions = {
  classic: {
    label: "Classic",
    description: "Walls end the run. Speed increases as you grow.",
    baseSpeedMs: 118,
    minSpeedMs: 58,
    speedStepMs: 4,
    scorePerFood: 10,
    wrapsWalls: false,
    durationMs: null,
  },
  blitz: {
    label: "Blitz",
    description: "Sixty seconds, higher food value, and faster movement.",
    baseSpeedMs: 98,
    minSpeedMs: 48,
    speedStepMs: 3,
    scorePerFood: 12,
    wrapsWalls: false,
    durationMs: 60_000,
  },
  zen: {
    label: "Zen",
    description: "Walls wrap. Slow down and keep the route alive.",
    baseSpeedMs: 145,
    minSpeedMs: 82,
    speedStepMs: 2,
    scorePerFood: 8,
    wrapsWalls: true,
    durationMs: null,
  },
} satisfies Record<SnakeMode, SnakeModeDefinition>;

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const opposites: Record<Direction, Direction> = {
  up: "down",
  right: "left",
  down: "up",
  left: "right",
};

export function createSnakeState(
  options: {
    boardSize?: number;
    mode?: SnakeMode;
    seed?: number;
  } = {},
): SnakeState {
  const mode = options.mode ?? "classic";
  const modeDefinition = snakeModeDefinitions[mode];
  const boardSize = options.boardSize ?? DEFAULT_BOARD_SIZE;
  const middle = Math.floor(boardSize / 2);
  const snake = Array.from({ length: INITIAL_LENGTH }, (_, index) => ({
    x: middle + Math.floor(INITIAL_LENGTH / 2) - index,
    y: middle,
  }));

  return {
    boardSize,
    mode,
    snake,
    previousSnake: snake,
    food: chooseFood(snake, boardSize, options.seed ?? boardSize * 13),
    direction: "right",
    queuedDirections: [],
    status: "ready",
    score: 0,
    foodsEaten: 0,
    scoreStreak: 0,
    lastScoreDelta: 0,
    tick: 0,
    speedMs: computeSnakeSpeed(mode, snake.length, 0),
    elapsedMs: 0,
    durationMs: modeDefinition.durationMs,
    lastEvent: "none",
  };
}

export function queueDirection(state: SnakeState, direction: Direction): SnakeState {
  if (state.status === "game-over") {
    return state;
  }

  const latestDirection = state.queuedDirections.at(-1) ?? state.direction;

  if (latestDirection === direction || opposites[latestDirection] === direction) {
    return state;
  }

  return {
    ...state,
    queuedDirections: [...state.queuedDirections, direction].slice(0, MAX_BUFFERED_DIRECTIONS),
    status: state.status === "ready" ? "playing" : state.status,
    lastEvent: "none",
  };
}

export function setSnakeStatus(state: SnakeState, status: SnakeStatus): SnakeState {
  if (state.status === "game-over" && status !== "ready") {
    return state;
  }

  return {
    ...state,
    status,
  };
}

export function toggleSnakePlay(state: SnakeState): SnakeState {
  if (state.status === "game-over") {
    return createSnakeState({ boardSize: state.boardSize, mode: state.mode });
  }

  return setSnakeStatus(state, state.status === "playing" ? "paused" : "playing");
}

export function restartSnake(state: SnakeState, mode = state.mode): SnakeState {
  return createSnakeState({ boardSize: state.boardSize, mode });
}

export function advanceSnakeClock(state: SnakeState, deltaMs: number): SnakeState {
  if (state.status !== "playing") {
    return state;
  }

  const elapsedMs = state.elapsedMs + Math.max(0, deltaMs);

  if (state.durationMs !== null && elapsedMs >= state.durationMs) {
    return {
      ...state,
      elapsedMs: state.durationMs,
      status: "game-over",
      lastEvent: "time-up",
    };
  }

  return {
    ...state,
    elapsedMs,
  };
}

export function stepSnake(state: SnakeState): SnakeState {
  if (state.status !== "playing") {
    return state;
  }

  const modeDefinition = snakeModeDefinitions[state.mode];
  const nextDirection = state.queuedDirections[0] ?? state.direction;
  const vector = directionVectors[nextDirection];
  const head = state.snake[0];
  const rawNextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const nextHead = modeDefinition.wrapsWalls
    ? wrapPoint(rawNextHead, state.boardSize)
    : rawNextHead;
  const nextQueuedDirections = state.queuedDirections.slice(1);

  if (!modeDefinition.wrapsWalls && isOutsideBoard(rawNextHead, state.boardSize)) {
    return endSnakeRound(state, nextDirection, nextQueuedDirections, "hit-wall");
  }

  const willEat = state.food ? pointsEqual(nextHead, state.food) : false;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);

  if (bodyToCheck.some((point) => pointsEqual(point, nextHead))) {
    return endSnakeRound(state, nextDirection, nextQueuedDirections, "hit-self");
  }

  const nextSnake = [nextHead, ...state.snake];

  if (!willEat) {
    nextSnake.pop();
  }

  const nextScoreStreak = willEat ? state.scoreStreak + 1 : state.scoreStreak;
  const scoreDelta = willEat
    ? computeSnakeScoreAward(state.mode, state.snake.length, state.score, nextScoreStreak)
    : 0;
  const nextScore = willEat ? state.score + scoreDelta : state.score;
  const nextFood = willEat
    ? chooseFood(nextSnake, state.boardSize, state.tick + nextScore + nextSnake.length * 19)
    : state.food;

  return {
    ...state,
    snake: nextSnake,
    previousSnake: state.snake,
    food: nextFood,
    direction: nextDirection,
    queuedDirections: nextQueuedDirections,
    score: nextScore,
    foodsEaten: willEat ? state.foodsEaten + 1 : state.foodsEaten,
    scoreStreak: nextScoreStreak,
    lastScoreDelta: willEat ? scoreDelta : state.lastScoreDelta,
    tick: state.tick + 1,
    speedMs: computeSnakeSpeed(state.mode, nextSnake.length, nextScore),
    status: willEat && nextFood === null ? "game-over" : state.status,
    lastEvent: willEat ? (nextFood === null ? "cleared" : "ate") : "none",
  };
}

export function computeSnakeSpeed(mode: SnakeMode, length: number, score: number) {
  const modeDefinition = snakeModeDefinitions[mode];
  const growthBoost = Math.max(0, length - INITIAL_LENGTH) * modeDefinition.speedStepMs;
  const scoreBoost = Math.floor(score / 50) * 2;

  return Math.max(modeDefinition.minSpeedMs, modeDefinition.baseSpeedMs - growthBoost - scoreBoost);
}

export function computeSnakeScoreAward(
  mode: SnakeMode,
  length: number,
  score: number,
  scoreStreak: number,
) {
  const modeDefinition = snakeModeDefinitions[mode];
  const currentSpeed = computeSnakeSpeed(mode, length, score);
  const speedBonus = Math.max(
    0,
    Math.floor((modeDefinition.baseSpeedMs - currentSpeed) / SCORE_SPEED_BONUS_STEP_MS),
  );
  const streakBonus = Math.min(
    SCORE_STREAK_BONUS_CAP,
    Math.floor(Math.max(0, scoreStreak - 1) / SCORE_STREAK_STEP) * SCORE_STREAK_BONUS,
  );

  return modeDefinition.scorePerFood + speedBonus + streakBonus;
}

export function getRemainingMs(state: SnakeState) {
  return state.durationMs === null ? null : Math.max(0, state.durationMs - state.elapsedMs);
}

export function getSnakeStatusLabel(status: SnakeStatus) {
  if (status === "game-over") {
    return "Game Over";
  }

  if (status === "ready") {
    return "Ready";
  }

  return status === "paused" ? "Paused" : "Playing";
}

export function pointsEqual(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function isOutsideBoard(point: Point, boardSize: number) {
  return point.x < 0 || point.y < 0 || point.x >= boardSize || point.y >= boardSize;
}

export function isSnakeMode(value: string): value is SnakeMode {
  return snakeModes.some((mode) => mode === value);
}

export function chooseFood(snake: Point[], boardSize: number, seed: number): Point | null {
  const occupied = new Set(snake.map((point) => `${point.x}:${point.y}`));
  const openCells: Point[] = [];

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const interiorCells = openCells.filter(
    (point) => point.x > 1 && point.y > 1 && point.x < boardSize - 2 && point.y < boardSize - 2,
  );
  const candidates = interiorCells.length > 0 ? interiorCells : openCells;
  const index = Math.abs(seed * 17 + snake.length * 31) % candidates.length;

  return candidates[index];
}

export function directionFromDelta(deltaX: number, deltaY: number): Direction | null {
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) {
    return null;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "down" : "up";
}

function endSnakeRound(
  state: SnakeState,
  direction: Direction,
  queuedDirections: Direction[],
  lastEvent: SnakeState["lastEvent"],
): SnakeState {
  return {
    ...state,
    direction,
    queuedDirections,
    previousSnake: state.snake,
    status: "game-over",
    tick: state.tick + 1,
    lastEvent,
  };
}

function wrapPoint(point: Point, boardSize: number): Point {
  return {
    x: (point.x + boardSize) % boardSize,
    y: (point.y + boardSize) % boardSize,
  };
}
