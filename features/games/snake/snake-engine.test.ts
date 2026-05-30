import { describe, expect, it } from "vitest";

import { createSnakeState, queueDirection, setSnakeStatus, stepSnake } from "./snake-engine";

describe("snake engine", () => {
  it("starts in a ready state with a stable board", () => {
    const state = createSnakeState();

    expect(state.status).toBe("ready");
    expect(state.boardSize).toBe(21);
    expect(state.snake).toHaveLength(5);
    expect(state.score).toBe(0);
  });

  it("moves forward when playing", () => {
    const state = setSnakeStatus(createSnakeState(), "playing");
    const next = stepSnake(state);

    expect(next.snake[0]).toEqual({ x: state.snake[0].x + 1, y: state.snake[0].y });
    expect(next.snake).toHaveLength(state.snake.length);
  });

  it("rejects direct reversals", () => {
    const state = setSnakeStatus(createSnakeState(), "playing");
    const queued = queueDirection(state, "left");

    expect(queued.queuedDirection).toBe("right");
  });

  it("scores and grows after eating", () => {
    const state = setSnakeStatus(
      {
        ...createSnakeState(),
        food: { x: 13, y: 10 },
      },
      "playing",
    );
    const next = stepSnake(state);

    expect(next.score).toBe(10);
    expect(next.snake).toHaveLength(state.snake.length + 1);
  });

  it("ends the round on wall collision", () => {
    const state = setSnakeStatus(
      {
        ...createSnakeState(),
        snake: [
          { x: 20, y: 10 },
          { x: 19, y: 10 },
          { x: 18, y: 10 },
        ],
      },
      "playing",
    );
    const next = stepSnake(state);

    expect(next.status).toBe("lost");
  });
});
