import { describe, expect, it } from "vitest";

import {
  advanceSnakeClock,
  computeSnakeScoreAward,
  createSnakeState,
  queueDirection,
  setSnakeStatus,
  stepSnake,
} from "./snake-engine";

describe("snake engine", () => {
  it("starts in a ready state with a stable board", () => {
    const state = createSnakeState();

    expect(state.status).toBe("ready");
    expect(state.mode).toBe("classic");
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

    expect(queued.queuedDirections).toEqual([]);
  });

  it("buffers quick non-reversal turns in order", () => {
    const state = setSnakeStatus(createSnakeState(), "playing");
    const queued = queueDirection(queueDirection(state, "down"), "left");
    const firstStep = stepSnake(queued);
    const secondStep = stepSnake(firstStep);

    expect(firstStep.direction).toBe("down");
    expect(secondStep.direction).toBe("left");
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
    expect(next.speedMs).toBeLessThan(state.speedMs);
    expect(next.foodsEaten).toBe(1);
    expect(next.scoreStreak).toBe(1);
    expect(next.lastScoreDelta).toBe(10);
  });

  it("adds speed and streak bonuses as a run builds", () => {
    const firstAward = computeSnakeScoreAward("classic", 5, 0, 1);
    const laterAward = computeSnakeScoreAward("classic", 13, 150, 7);

    expect(firstAward).toBe(10);
    expect(laterAward).toBeGreaterThan(firstAward);
  });

  it("ends classic rounds on wall collision", () => {
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

    expect(next.status).toBe("game-over");
    expect(next.lastEvent).toBe("crashed");
  });

  it("wraps walls in zen mode", () => {
    const state = setSnakeStatus(
      {
        ...createSnakeState({ mode: "zen" }),
        direction: "left",
        snake: [
          { x: 0, y: 10 },
          { x: 1, y: 10 },
          { x: 2, y: 10 },
        ],
        previousSnake: [
          { x: 0, y: 10 },
          { x: 1, y: 10 },
          { x: 2, y: 10 },
        ],
      },
      "playing",
    );
    const next = stepSnake(state);

    expect(next.status).toBe("playing");
    expect(next.snake[0]).toEqual({ x: 20, y: 10 });
  });

  it("ends blitz when the timer expires", () => {
    const state = setSnakeStatus(createSnakeState({ mode: "blitz" }), "playing");
    const next = advanceSnakeClock(state, 60_000);

    expect(next.status).toBe("game-over");
    expect(next.lastEvent).toBe("time-up");
  });
});
