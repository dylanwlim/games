"use client";

import {
  Apple,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Gauge,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  directionFromDelta,
  getRemainingMs,
  getSnakeStatusLabel,
  snakeModeDefinitions,
} from "./snake-engine";
import {
  snakeModes,
  type Direction,
  type Point,
  type SnakeMode,
  type SnakeState,
} from "./snakeTypes";
import { useSnakeGame } from "./useSnakeGame";

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

const directionControls = [
  { direction: "up", label: "Move up", Icon: ArrowUp },
  { direction: "left", label: "Move left", Icon: ArrowLeft },
  { direction: "right", label: "Move right", Icon: ArrowRight },
  { direction: "down", label: "Move down", Icon: ArrowDown },
] satisfies Array<{ direction: Direction; label: string; Icon: typeof ArrowUp }>;

const modeShortDescriptions = {
  classic: "Walls",
  blitz: "60 sec",
  zen: "Wraps",
} satisfies Record<SnakeMode, string>;

type PointerStart = {
  pointerId: number;
  x: number;
  y: number;
};

type SnakeGameProps = {
  menuOpen?: boolean;
};

export function SnakeGame({ menuOpen = false }: SnakeGameProps) {
  const { state, stateRef, bestScore, bestScores, topScore, modeDefinition, actions } =
    useSnakeGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const moveAccumulatorRef = useRef(0);
  const clockAccumulatorRef = useRef(0);
  const pointerStartRef = useRef<PointerStart | null>(null);
  const statusLabel = getSnakeStatusLabel(state.status);
  const remainingMs = getRemainingMs(state);
  const speedLabel = `${(1000 / state.speedMs).toFixed(1)}/s`;
  const lastScoreLabel = state.lastScoreDelta > 0 ? `+${state.lastScoreDelta}` : "0";
  const modeLabel = snakeModeDefinitions[state.mode].label;
  const hasStarted =
    state.status !== "ready" || state.score > 0 || state.foodsEaten > 0 || state.tick > 0;
  const primaryActionLabel =
    state.status === "game-over"
      ? "Restart"
      : state.status === "playing"
        ? "Pause"
        : state.status === "paused"
          ? "Resume"
          : "Start";
  const overlayCopy = useMemo(() => getOverlayCopy(state), [state]);

  const handleFullscreen = useCallback(() => {
    const board = boardRef.current;

    if (!board) {
      return;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void board.requestFullscreen();
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (stateRef.current.status === "game-over") {
      actions.restart();
    } else {
      actions.togglePlay();
    }
  }, [actions, stateRef]);

  const handleRestart = useCallback(() => {
    actions.restart();
  }, [actions]);

  const handleKeyboardInput = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (shouldIgnoreShortcut(event.target)) {
        return;
      }

      const direction = directionKeys[event.code];

      if (direction) {
        event.preventDefault();
        actions.queueMove(direction);
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      if (event.code === "KeyP") {
        event.preventDefault();
        actions.togglePlay();
        return;
      }

      if (event.code === "KeyF") {
        event.preventDefault();
        handleFullscreen();
        return;
      }

      if (
        event.code === "KeyR" ||
        (event.code === "Enter" && stateRef.current.status === "game-over")
      ) {
        event.preventDefault();
        actions.restart();
        return;
      }

      if (event.code === "Escape") {
        event.preventDefault();
        actions.pause();
      }
    },
    [actions, handleFullscreen, stateRef],
  );

  useEffect(() => {
    if (menuOpen) {
      actions.pause();
    }
  }, [actions, menuOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardInput);

    return () => window.removeEventListener("keydown", handleKeyboardInput);
  }, [handleKeyboardInput]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) {
        actions.pause();
      }
    };

    window.addEventListener("blur", actions.pause);
    document.addEventListener("visibilitychange", pauseWhenHidden);

    return () => {
      window.removeEventListener("blur", actions.pause);
      document.removeEventListener("visibilitychange", pauseWhenHidden);
    };
  }, [actions]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
      }

      const delta = Math.min(80, timestamp - lastFrameRef.current);
      lastFrameRef.current = timestamp;
      const currentState = stateRef.current;

      if (currentState.status === "playing") {
        moveAccumulatorRef.current += delta;
        clockAccumulatorRef.current += delta;

        let steps = 0;

        while (moveAccumulatorRef.current >= currentState.speedMs && steps < 3) {
          moveAccumulatorRef.current -= currentState.speedMs;
          steps += 1;
        }

        const shouldSyncClock =
          clockAccumulatorRef.current >= 100 ||
          (currentState.durationMs !== null &&
            currentState.durationMs - currentState.elapsedMs <= clockAccumulatorRef.current);

        if (steps > 0 || shouldSyncClock) {
          const clockDeltaMs = shouldSyncClock ? clockAccumulatorRef.current : 0;

          if (shouldSyncClock) {
            clockAccumulatorRef.current = 0;
          }

          actions.advanceFrame({ clockDeltaMs, steps });
        }
      } else {
        moveAccumulatorRef.current = 0;
        clockAccumulatorRef.current = 0;
      }

      const drawState = stateRef.current;
      const progress =
        drawState.status === "playing"
          ? Math.min(1, moveAccumulatorRef.current / drawState.speedMs)
          : 1;

      drawSnakeBoard(canvasRef.current, drawState, progress, timestamp);
      animationRef.current = window.requestAnimationFrame(loop);
    };

    animationRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = null;
      lastFrameRef.current = 0;
    };
  }, [actions, stateRef]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartRef.current) {
      event.preventDefault();
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;

    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    pointerStartRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const direction = directionFromDelta(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y,
    );

    if (direction) {
      actions.queueMove(direction);
    }
  };

  const handleModeTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (state.status === "playing") {
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.code)) {
      return;
    }

    event.preventDefault();
    const currentIndex = snakeModes.indexOf(state.mode);
    const nextIndex =
      event.code === "Home"
        ? 0
        : event.code === "End"
          ? snakeModes.length - 1
          : event.code === "ArrowRight"
            ? (currentIndex + 1) % snakeModes.length
            : (currentIndex - 1 + snakeModes.length) % snakeModes.length;
    const nextMode = snakeModes[nextIndex];

    actions.selectMode(nextMode);
    window.requestAnimationFrame(() => {
      document.getElementById(`snake-mode-tab-${nextMode}`)?.focus();
    });
  };

  return (
    <section
      className={`snake-game mode-${state.mode} status-${state.status} ${
        menuOpen ? "sidebar-open" : ""
      }`}
      aria-label="Snake game"
    >
      <div className="snake-toolbar">
        <div>
          <p>Games / Snake</p>
          <h2>Snake</h2>
          <span>Eat the dot. Grow the snake. Avoid walls and yourself.</span>
        </div>
        {state.status === "playing" ? (
          <span className="snake-status-chip status-playing" aria-live="polite">
            {statusLabel}
          </span>
        ) : null}
      </div>

      <span id="snake-board-instructions" className="sr-only">
        Move with arrow keys, WASD, or swipe. Pause with Space or P. Restart with R.
      </span>

      <div className="snake-game-shell">
        <div
          ref={boardRef}
          className={`snake-canvas-shell status-${state.status}`}
          role="application"
          tabIndex={0}
          aria-describedby="snake-board-instructions"
          aria-label={`Snake board. ${statusLabel}. Score ${state.score}. Best ${bestScore}. Top ${topScore}. Streak ${state.scoreStreak}.`}
          onPointerCancel={() => {
            pointerStartRef.current = null;
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
        >
          <canvas ref={canvasRef} className="snake-canvas" aria-hidden="true" />
          {state.status !== "playing" ? (
            <div className="snake-state-overlay" aria-live="polite">
              <p>{statusLabel}</p>
              <strong>{overlayCopy.title}</strong>
              <span>{overlayCopy.body}</span>
            </div>
          ) : null}
        </div>

        <aside className="snake-side-panel" aria-label="Snake stats and actions">
          <RunSummary
            score={state.score}
            lastScoreLabel={lastScoreLabel}
            statusLabel={statusLabel}
            topScore={topScore}
          />
          <div className="snake-score-strip" aria-label="Snake score">
            <Metric label="Length" value={String(state.snake.length)} />
            <Metric label="Streak" value={String(state.scoreStreak)} />
            <Metric label="Last bite" value={lastScoreLabel} />
            <Metric
              label={state.mode === "blitz" ? "Time" : "Speed"}
              value={remainingMs === null ? speedLabel : formatTime(remainingMs)}
            />
          </div>

          <TopScorePanel bestScores={bestScores} currentMode={state.mode} />

          <div
            className="snake-mode-tabs"
            role="tablist"
            aria-label="Snake modes"
            onKeyDown={handleModeTabKeyDown}
          >
            {snakeModes.map((mode) => (
              <button
                key={mode}
                id={`snake-mode-tab-${mode}`}
                className={state.mode === mode ? "active" : ""}
                type="button"
                role="tab"
                aria-controls="snake-mode-description"
                aria-selected={state.mode === mode}
                onClick={() => actions.selectMode(mode)}
              >
                {snakeModeDefinitions[mode].label}
              </button>
            ))}
          </div>

          <div className="snake-actions">
            <button
              className="primary-action"
              type="button"
              aria-label={`${primaryActionLabel} Snake`}
              onClick={handlePrimaryAction}
            >
              {state.status === "playing" ? (
                <Pause aria-hidden="true" />
              ) : state.status === "game-over" ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              {primaryActionLabel}
            </button>
            {state.status !== "game-over" ? (
              <button className="secondary-action" type="button" onClick={handleRestart}>
                <RotateCcw aria-hidden="true" />
                Restart
              </button>
            ) : null}
            <button
              className="secondary-action"
              type="button"
              aria-label="Fullscreen Snake"
              onClick={handleFullscreen}
            >
              <Maximize2 aria-hidden="true" />
              Focus
            </button>
          </div>

          <p id="snake-mode-description" className="snake-hint">
            {modeDefinition.description}
          </p>
        </aside>
      </div>

      <div className="touch-pad" aria-label="Touch direction controls">
        {directionControls.map(({ direction, label, Icon }) => (
          <button
            key={direction}
            type="button"
            aria-label={label}
            onClick={() => actions.queueMove(direction)}
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Snake status: {statusLabel}. Score {state.score}. Best {bestScore}. Top {topScore}. Length{" "}
        {state.snake.length}. Streak {state.scoreStreak}. Speed {speedLabel}.
      </p>
    </section>
  );
}

function RunSummary({
  score,
  lastScoreLabel,
  statusLabel,
  topScore,
}: {
  score: number;
  lastScoreLabel: string;
  statusLabel: string;
  topScore: number;
}) {
  return (
    <div className="snake-run-summary" aria-label="Current Snake run">
      <div>
        <span>Score</span>
        <strong>{score}</strong>
      </div>
      <div className="snake-run-summary-meta">
        <span>{statusLabel}</span>
        <span>Last bite {lastScoreLabel}</span>
        <span>Top {topScore}</span>
      </div>
    </div>
  );
}

function TopScorePanel({
  bestScores,
  currentMode,
}: {
  bestScores: Record<SnakeMode, number>;
  currentMode: SnakeMode;
}) {
  const topScore = Math.max(...Object.values(bestScores));

  return (
    <section className="snake-top-score" aria-label="Top scores">
      <div className="snake-top-score-header">
        <span>Top score</span>
        <strong>{topScore}</strong>
      </div>
      <div className="snake-top-score-list">
        {snakeModes.map((mode) => (
          <div key={mode} className={`snake-top-score-row ${mode === currentMode ? "active" : ""}`}>
            <span>{snakeModeDefinitions[mode].label}</span>
            <strong>{bestScores[mode] ?? 0}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getOverlayCopy(state: SnakeState) {
  if (state.status === "game-over") {
    if (state.lastEvent === "time-up") {
      return {
        title: "Time expired.",
        body: "Restart instantly or switch modes for a different pace.",
      };
    }

    if (state.lastEvent === "cleared") {
      return {
        title: "Board cleared.",
        body: "Clean route. Start another round when ready.",
      };
    }

    return {
      title: "Game Over",
      body: "Restart instantly, then buffer your next turn a little earlier.",
    };
  }

  if (state.status === "paused") {
    return {
      title: "Paused",
      body: "Resume when the route is clear and keep the streak alive.",
    };
  }

  return {
    title: "Snake",
    body: "Chain bites, build streaks, and push the top score.",
  };
}

function shouldIgnoreShortcut(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("button, a, input, select, textarea, [contenteditable='true']"));
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function drawSnakeBoard(
  canvas: HTMLCanvasElement | null,
  state: SnakeState,
  progress: number,
  timestamp: number,
) {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.imageSmoothingEnabled = true;
  context.clearRect(0, 0, width, height);
  const boardGradient = context.createLinearGradient(0, 0, width, height);
  boardGradient.addColorStop(0, "#111d2b");
  boardGradient.addColorStop(0.58, "#0b1420");
  boardGradient.addColorStop(1, "#07101a");
  context.fillStyle = boardGradient;
  context.fillRect(0, 0, width, height);

  const boardGlow = context.createRadialGradient(
    width * 0.28,
    height * 0.2,
    0,
    width * 0.28,
    height * 0.2,
    width * 0.72,
  );
  boardGlow.addColorStop(0, "rgba(131, 228, 111, 0.12)");
  boardGlow.addColorStop(1, "rgba(131, 228, 111, 0)");
  context.fillStyle = boardGlow;
  context.fillRect(0, 0, width, height);

  const padding = Math.max(12 * dpr, Math.min(width, height) * 0.052);
  const boardPixels = Math.max(1, Math.min(width - padding * 2, height - padding * 2));
  const cellSize = boardPixels / state.boardSize;
  const originX = (width - boardPixels) / 2;
  const originY = (height - boardPixels) / 2;

  drawGrid(context, state.boardSize, originX, originY, boardPixels, cellSize, dpr);
  drawFood(context, state, originX, originY, cellSize, dpr, timestamp);
  drawSnake(context, state, progress, originX, originY, cellSize, dpr);

  if (state.status === "game-over") {
    context.fillStyle = "rgba(5, 10, 17, 0.38)";
    context.fillRect(0, 0, width, height);
  }
}

function drawGrid(
  context: CanvasRenderingContext2D,
  boardSize: number,
  originX: number,
  originY: number,
  boardPixels: number,
  cellSize: number,
  dpr: number,
) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.045)";
  context.lineWidth = 1 * dpr;

  for (let index = 0; index <= boardSize; index += 1) {
    const x = originX + index * cellSize;
    const y = originY + index * cellSize;

    context.beginPath();
    context.moveTo(x, originY);
    context.lineTo(x, originY + boardPixels);
    context.stroke();

    context.beginPath();
    context.moveTo(originX, y);
    context.lineTo(originX + boardPixels, y);
    context.stroke();
  }

  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.lineWidth = 1.5 * dpr;
  roundedRect(context, originX, originY, boardPixels, boardPixels, 16 * dpr);
  context.stroke();
  context.restore();
}

function drawFood(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
  timestamp: number,
) {
  if (!state.food) {
    return;
  }

  const pulse = 1 + Math.sin(timestamp / 170) * 0.08;
  const foodSize = cellSize * 0.58 * pulse;
  const foodX = originX + state.food.x * cellSize + (cellSize - foodSize) / 2;
  const foodY = originY + state.food.y * cellSize + (cellSize - foodSize) / 2;
  const centerX = foodX + foodSize / 2;
  const centerY = foodY + foodSize / 2;

  context.save();
  context.shadowColor = "rgba(255, 111, 99, 0.48)";
  context.shadowBlur = 18 * dpr;
  context.fillStyle = "rgba(255, 111, 99, 0.18)";
  context.beginPath();
  context.arc(centerX, centerY, foodSize * 0.92, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 10 * dpr;
  context.fillStyle = "#ff6f63";
  roundedRect(context, foodX, foodY, foodSize, foodSize, Math.max(4 * dpr, foodSize * 0.28));
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.74)";
  context.beginPath();
  context.arc(
    foodX + foodSize * 0.68,
    foodY + foodSize * 0.32,
    Math.max(1.5 * dpr, foodSize * 0.09),
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();
}

function drawSnake(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  progress: number,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
) {
  state.snake.forEach((point, index) => {
    const previousPoint =
      state.previousSnake[index] ?? state.previousSnake[state.previousSnake.length - 1] ?? point;
    const drawPoint =
      state.status === "playing"
        ? interpolatePoint(previousPoint, point, progress, state.boardSize)
        : point;
    const isHead = index === 0;
    const atePulse = isHead && state.lastEvent === "ate" ? 0.04 : 0;
    const inset = cellSize * (isHead ? 0.09 - atePulse : 0.15);
    const size = cellSize - inset * 2;
    const radius = Math.max(4 * dpr, size * 0.24);
    const x = originX + drawPoint.x * cellSize + inset;
    const y = originY + drawPoint.y * cellSize + inset;

    context.save();
    context.shadowColor = isHead ? "rgba(131, 228, 111, 0.34)" : "rgba(103, 201, 95, 0.16)";
    context.shadowBlur = isHead ? 14 * dpr : 6 * dpr;
    context.fillStyle = isHead ? "#9bea82" : blendSnakeColor(index, state.snake.length);
    roundedRect(context, x, y, size, size, radius);
    context.fill();

    if (isHead) {
      const highlight = context.createLinearGradient(x, y, x + size, y + size);
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = highlight;
      roundedRect(context, x, y, size, size, radius);
      context.fill();
      drawSnakeEyes(context, x, y, size, dpr, state.direction);
    }

    context.restore();
  });
}

function blendSnakeColor(index: number, length: number) {
  const ratio = length <= 1 ? 0 : index / Math.max(1, length - 1);
  const green = Math.round(214 - ratio * 40);

  return `rgb(118, ${green}, 111)`;
}

function drawSnakeEyes(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dpr: number,
  direction: Direction,
) {
  const eyeRadius = Math.max(1.7 * dpr, size * 0.07);
  const eyePositions: Record<Direction, Array<[number, number]>> = {
    up: [
      [0.34, 0.34],
      [0.66, 0.34],
    ],
    right: [
      [0.66, 0.34],
      [0.66, 0.66],
    ],
    down: [
      [0.34, 0.66],
      [0.66, 0.66],
    ],
    left: [
      [0.34, 0.34],
      [0.34, 0.66],
    ],
  };

  context.fillStyle = "#101926";
  eyePositions[direction].forEach(([eyeX, eyeY]) => {
    context.beginPath();
    context.arc(x + size * eyeX, y + size * eyeY, eyeRadius, 0, Math.PI * 2);
    context.fill();
  });
}

function interpolatePoint(from: Point, to: Point, progress: number, boardSize: number): Point {
  if (Math.abs(from.x - to.x) > boardSize / 2 || Math.abs(from.y - to.y) > boardSize / 2) {
    return to;
  }

  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
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
