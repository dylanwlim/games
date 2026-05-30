"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createSnakeState,
  queueDirection,
  setSnakeSpeed,
  setSnakeStatus,
  stepSnake,
  type Direction,
  type SnakeState,
} from "./snake-engine";

const speedOptions = [
  { label: "Calm", value: 150 },
  { label: "Normal", value: 115 },
  { label: "Fast", value: 82 },
] as const;

const directionKeys: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowRight: "right",
  KeyD: "right",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
};

const bestScoreKey = "dylan-games:snake-best";

type SnakeViewState = {
  game: SnakeState;
  bestScore: number;
};

export function SnakeGame() {
  const [viewState, setViewState] = useState<SnakeViewState>(() => ({
    game: createSnakeState(),
    bestScore: 0,
  }));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = viewState.game;
  const bestScore = viewState.bestScore;
  const stateRef = useRef(state);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const bestScoreLoadedRef = useRef(false);

  const updateGame = useCallback((updater: (previousState: SnakeState) => SnakeState) => {
    setViewState((previousViewState) => {
      const game = updater(previousViewState.game);

      return {
        game,
        bestScore: Math.max(previousViewState.bestScore, game.score),
      };
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!bestScoreLoadedRef.current) {
      return;
    }

    window.localStorage.setItem(bestScoreKey, String(bestScore));
  }, [bestScore]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedBest = Number(window.localStorage.getItem(bestScoreKey));
      bestScoreLoadedRef.current = true;

      if (Number.isFinite(storedBest)) {
        setViewState((previousViewState) => ({
          ...previousViewState,
          bestScore: Math.max(previousViewState.bestScore, storedBest),
        }));
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const currentState = stateRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#101926";
    context.fillRect(0, 0, width, height);

    const padding = 22 * dpr;
    const boardPixels = Math.min(width - padding * 2, height - padding * 2);
    const cellSize = boardPixels / currentState.boardSize;
    const originX = (width - boardPixels) / 2;
    const originY = (height - boardPixels) / 2;

    context.strokeStyle = "rgba(255, 255, 255, 0.045)";
    context.lineWidth = 1 * dpr;

    for (let index = 0; index <= currentState.boardSize; index += 1) {
      const position = originX + index * cellSize;
      context.beginPath();
      context.moveTo(position, originY);
      context.lineTo(position, originY + boardPixels);
      context.stroke();

      const yPosition = originY + index * cellSize;
      context.beginPath();
      context.moveTo(originX, yPosition);
      context.lineTo(originX + boardPixels, yPosition);
      context.stroke();
    }

    currentState.snake.forEach((point, index) => {
      const radius = Math.max(4 * dpr, cellSize * 0.22);
      const x = originX + point.x * cellSize + cellSize * 0.12;
      const y = originY + point.y * cellSize + cellSize * 0.12;
      const size = cellSize * 0.76;

      context.fillStyle = index === 0 ? "#9bea82" : "#76d66f";
      roundedRect(context, x, y, size, size, radius);
      context.fill();

      if (index === 0) {
        context.fillStyle = "#101926";
        context.beginPath();
        context.arc(
          x + size * 0.34,
          y + size * 0.42,
          Math.max(1.8 * dpr, size * 0.07),
          0,
          Math.PI * 2,
        );
        context.arc(
          x + size * 0.66,
          y + size * 0.42,
          Math.max(1.8 * dpr, size * 0.07),
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    });

    const foodSize = cellSize * 0.58;
    const foodX = originX + currentState.food.x * cellSize + (cellSize - foodSize) / 2;
    const foodY = originY + currentState.food.y * cellSize + (cellSize - foodSize) / 2;
    context.fillStyle = "#ff776d";
    roundedRect(context, foodX, foodY, foodSize, foodSize, Math.max(4 * dpr, foodSize * 0.22));
    context.fill();

    if (currentState.status === "lost") {
      context.fillStyle = "rgba(16, 25, 38, 0.72)";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#f7f8fb";
      context.font = `${22 * dpr}px ${getComputedStyle(document.body).fontFamily}`;
      context.textAlign = "center";
      context.fillText("Round over", width / 2, height / 2);
    }
  }, []);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
      }

      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      accumulatorRef.current += delta;

      const currentState = stateRef.current;
      if (currentState.status === "playing" && accumulatorRef.current >= currentState.speedMs) {
        updateGame((previousState) => stepSnake(previousState));
        accumulatorRef.current = 0;
      }

      draw();
      animationRef.current = window.requestAnimationFrame(loop);
    };

    animationRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, updateGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = directionKeys[event.code];

      if (direction) {
        event.preventDefault();
        updateGame((previousState) => queueDirection(previousState, direction));
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        updateGame((previousState) =>
          setSnakeStatus(previousState, previousState.status === "playing" ? "paused" : "playing"),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [updateGame]);

  const statusLabel = useMemo(() => {
    if (state.status === "ready") {
      return "Ready";
    }

    if (state.status === "lost") {
      return "Round over";
    }

    return state.status === "paused" ? "Paused" : "Playing";
  }, [state.status]);

  const togglePlay = () => {
    updateGame((previousState) =>
      setSnakeStatus(previousState, previousState.status === "playing" ? "paused" : "playing"),
    );
  };

  const reset = () => {
    updateGame(() => createSnakeState({ speedMs: state.speedMs }));
  };

  return (
    <section className="snake-game" aria-label="Snake game">
      <div className="snake-canvas-shell">
        <canvas
          ref={canvasRef}
          className="snake-canvas"
          aria-label={`Snake board. ${statusLabel}. Score ${state.score}.`}
          role="img"
        />
        <button
          className="canvas-control"
          type="button"
          onClick={togglePlay}
          aria-label={state.status === "playing" ? "Pause Snake" : "Play Snake"}
        >
          {state.status === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <div className="canvas-score" aria-hidden="true">
          {state.score}
        </div>
      </div>

      <div className="snake-controls" aria-label="Snake controls">
        <div className="metric">
          <span>Score</span>
          <strong>{state.score}</strong>
        </div>
        <div className="metric">
          <span>Best</span>
          <strong>{bestScore}</strong>
        </div>
        <label className="speed-control">
          <span>Speed</span>
          <select
            value={state.speedMs}
            onChange={(event) =>
              updateGame((previousState) =>
                setSnakeSpeed(previousState, Number(event.target.value)),
              )
            }
          >
            {speedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-action" type="button" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          New Game
        </button>
      </div>

      <div className="touch-pad" aria-label="Touch direction controls">
        <button
          type="button"
          aria-label="Move up"
          onClick={() => updateGame((previousState) => queueDirection(previousState, "up"))}
        >
          Up
        </button>
        <button
          type="button"
          aria-label="Move left"
          onClick={() => updateGame((previousState) => queueDirection(previousState, "left"))}
        >
          Left
        </button>
        <button
          type="button"
          aria-label="Move right"
          onClick={() => updateGame((previousState) => queueDirection(previousState, "right"))}
        >
          Right
        </button>
        <button
          type="button"
          aria-label="Move down"
          onClick={() => updateGame((previousState) => queueDirection(previousState, "down"))}
        >
          Down
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        Snake status: {statusLabel}. Score {state.score}. Best {bestScore}.
      </p>
    </section>
  );
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}
