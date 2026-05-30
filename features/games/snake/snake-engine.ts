export type Direction = "up" | "right" | "down" | "left";

export type Point = {
  x: number;
  y: number;
};

export type SnakeStatus = "ready" | "playing" | "paused" | "lost";

export type SnakeState = {
  boardSize: number;
  snake: Point[];
  food: Point;
  direction: Direction;
  queuedDirection: Direction;
  status: SnakeStatus;
  score: number;
  tick: number;
  speedMs: number;
};

const DEFAULT_BOARD_SIZE = 21;
const DEFAULT_SPEED_MS = 115;

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

export function createSnakeState(options: Partial<Pick<SnakeState, "boardSize" | "speedMs">> = {}) {
  const boardSize = options.boardSize ?? DEFAULT_BOARD_SIZE;
  const middle = Math.floor(boardSize / 2);

  return {
    boardSize,
    snake: [
      { x: middle + 2, y: middle },
      { x: middle + 1, y: middle },
      { x: middle, y: middle },
      { x: middle - 1, y: middle },
      { x: middle - 2, y: middle },
    ],
    food: { x: Math.min(boardSize - 4, middle + 7), y: middle - 2 },
    direction: "right",
    queuedDirection: "right",
    status: "ready",
    score: 0,
    tick: 0,
    speedMs: options.speedMs ?? DEFAULT_SPEED_MS,
  } satisfies SnakeState;
}

export function queueDirection(state: SnakeState, direction: Direction): SnakeState {
  if (opposites[state.direction] === direction) {
    return state;
  }

  return {
    ...state,
    queuedDirection: direction,
    status: state.status === "ready" ? "playing" : state.status,
  };
}

export function setSnakeStatus(state: SnakeState, status: SnakeStatus): SnakeState {
  if (state.status === "lost" && status !== "ready") {
    return state;
  }

  return {
    ...state,
    status,
  };
}

export function setSnakeSpeed(state: SnakeState, speedMs: number): SnakeState {
  return {
    ...state,
    speedMs,
  };
}

export function stepSnake(state: SnakeState): SnakeState {
  if (state.status !== "playing") {
    return state;
  }

  const vector = directionVectors[state.queuedDirection];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const willEat = pointsEqual(nextHead, state.food);
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);

  if (
    isOutsideBoard(nextHead, state.boardSize) ||
    bodyToCheck.some((point) => pointsEqual(point, nextHead))
  ) {
    return {
      ...state,
      direction: state.queuedDirection,
      status: "lost",
      tick: state.tick + 1,
    };
  }

  const nextSnake = [nextHead, ...state.snake];

  if (!willEat) {
    nextSnake.pop();
  }

  return {
    ...state,
    snake: nextSnake,
    food: willEat ? chooseFood(nextSnake, state.boardSize, state.tick + state.score) : state.food,
    direction: state.queuedDirection,
    score: willEat ? state.score + 10 : state.score,
    tick: state.tick + 1,
  };
}

export function pointsEqual(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function isOutsideBoard(point: Point, boardSize: number) {
  return point.x < 0 || point.y < 0 || point.x >= boardSize || point.y >= boardSize;
}

export function chooseFood(snake: Point[], boardSize: number, seed: number) {
  const occupied = new Set(snake.map((point) => `${point.x}:${point.y}`));
  const openCells: Point[] = [];

  for (let y = 1; y < boardSize - 1; y += 1) {
    for (let x = 1; x < boardSize - 1; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return { x: 0, y: 0 };
  }

  return openCells[Math.abs(seed * 17 + snake.length * 31) % openCells.length];
}
