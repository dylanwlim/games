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
import { AnimatePresence, m, useSpring, useTransform } from "motion/react";
import Link from "next/link";
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
} from "./snake-types";
import { useSnakeGame } from "./use-snake-game";

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

const targetFrameMs = 1000 / 60;

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
  const lastPaintRef = useRef(0);
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
      const paintDelta = timestamp - lastPaintRef.current;

      if (lastPaintRef.current === 0 || paintDelta >= targetFrameMs - 1) {
        const progress =
          drawState.status === "playing"
            ? Math.min(1, moveAccumulatorRef.current / drawState.speedMs)
            : 1;

        drawSnakeBoard(canvasRef.current, drawState, progress, timestamp);
        lastPaintRef.current =
          paintDelta > targetFrameMs ? timestamp - (paintDelta % targetFrameMs) : timestamp;
      }

      animationRef.current = window.requestAnimationFrame(loop);
    };

    animationRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = null;
      lastFrameRef.current = 0;
      lastPaintRef.current = 0;
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
      <header className="snake-toolbar">
        <div className="snake-title-block">
          <Link className="snake-back-link" href="/">
            <span aria-hidden="true">←</span> Games
          </Link>
          <div>
            <h2>Snake</h2>
            <span>Eat apples. Chain streaks. Don&apos;t crash.</span>
          </div>
        </div>
        <div className="snake-header-stats" aria-label="Snake run state">
          <span>{modeLabel}</span>
          <span className={`snake-status-chip status-${state.status}`} aria-live="polite">
            {statusLabel}
          </span>
          <span>
            Best <AnimatedNumber value={bestScore} />
          </span>
        </div>
      </header>

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
          aria-label={`Snake board. ${statusLabel}. Score ${state.score}. Best ${bestScore}. Overall best ${topScore}. Streak ${state.scoreStreak}.`}
          onPointerCancel={() => {
            pointerStartRef.current = null;
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
        >
          <canvas ref={canvasRef} className="snake-canvas" aria-hidden="true" />
          <AnimatePresence>
            {state.status !== "playing" ? (
              <StateOverlay
                bestScore={bestScore}
                modeLabel={modeLabel}
                onPrimaryAction={handlePrimaryAction}
                overlayCopy={overlayCopy}
                primaryActionLabel={primaryActionLabel}
                state={state}
              />
            ) : null}
          </AnimatePresence>
        </div>

        <aside className="snake-side-panel" aria-label="Snake stats and actions">
          <RunSummary
            bestScore={bestScore}
            modeLabel={modeLabel}
            score={state.score}
            lastScoreLabel={lastScoreLabel}
          />
          <div className="snake-score-strip" aria-label="Snake run stats">
            <Metric
              Icon={Apple}
              label="Apples"
              muted={state.status === "ready"}
              value={String(state.foodsEaten)}
            />
            <Metric Icon={Sparkles} label="Streak" value={`x${state.scoreStreak}`} />
            <Metric
              Icon={Trophy}
              label="Length"
              muted={state.status === "ready"}
              value={String(state.snake.length)}
            />
            <Metric
              Icon={Gauge}
              label={state.mode === "blitz" ? "Time" : "Speed"}
              value={remainingMs === null ? speedLabel : formatTime(remainingMs)}
            />
          </div>

          <BestScoresPanel bestScores={bestScores} />

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
                disabled={state.status === "playing"}
                onClick={() => actions.selectMode(mode)}
              >
                <AnimatePresence initial={false}>
                  {state.mode === mode ? (
                    <m.span
                      className="snake-mode-tab-bubble"
                      layoutId="snake-mode-tab-bubble"
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    />
                  ) : null}
                </AnimatePresence>
                <span className="snake-mode-tab-content">
                  <span>{snakeModeDefinitions[mode].label}</span>
                  <small>{modeShortDescriptions[mode]}</small>
                </span>
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
              <span>{primaryActionLabel}</span>
              <kbd>Space</kbd>
            </button>
            {hasStarted && state.status !== "game-over" ? (
              <button
                className="secondary-action"
                type="button"
                aria-label="Restart Snake"
                onClick={handleRestart}
              >
                <RotateCcw aria-hidden="true" />
                <span>Restart</span>
                <kbd>R</kbd>
              </button>
            ) : null}
            <button
              className="secondary-action"
              type="button"
              aria-label="Fullscreen Snake"
              onClick={handleFullscreen}
            >
              <Maximize2 aria-hidden="true" />
              <span>Fullscreen</span>
              <kbd>F</kbd>
            </button>
          </div>

          <p id="snake-mode-description" className="snake-hint">
            {modeLabel}: {modeDefinition.description} Move with Arrow keys or WASD.
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
        Snake status: {statusLabel}. Score {state.score}. Best {bestScore}. Overall best {topScore}.
        Length {state.snake.length}. Streak {state.scoreStreak}. Speed {speedLabel}.
      </p>
    </section>
  );
}

function StateOverlay({
  bestScore,
  modeLabel,
  onPrimaryAction,
  overlayCopy,
  primaryActionLabel,
  state,
}: {
  bestScore: number;
  modeLabel: string;
  onPrimaryAction: () => void;
  overlayCopy: ReturnType<typeof getOverlayCopy>;
  primaryActionLabel: string;
  state: SnakeState;
}) {
  const overlayStats =
    state.status === "ready"
      ? [
          ["Move", "Arrows"],
          ["Start/Pause", "Space"],
          ["Fullscreen", "F"],
        ]
      : [
          ["Score", String(state.score)],
          ["Best", String(bestScore)],
          ["Length", String(state.snake.length)],
        ];

  return (
    <m.div
      className={`snake-state-overlay status-${state.status}`}
      aria-live="polite"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="snake-overlay-kicker">
        <span>{overlayCopy.kicker}</span>
        <small>{modeLabel}</small>
      </div>
      <strong>{overlayCopy.title}</strong>
      <span>{overlayCopy.body}</span>
      <div className="snake-overlay-stats" aria-label="Snake overlay stats">
        {overlayStats.map(([label, value]) => (
          <span key={label}>
            <small>{label}</small>
            <b>{value}</b>
          </span>
        ))}
      </div>
      <button className="snake-overlay-action" type="button" onClick={onPrimaryAction}>
        {state.status === "game-over" ? (
          <RotateCcw aria-hidden="true" />
        ) : (
          <Play aria-hidden="true" />
        )}
        <span>{primaryActionLabel}</span>
        <kbd>{state.status === "game-over" ? "R" : "Space"}</kbd>
      </button>
    </m.div>
  );
}

function RunSummary({
  bestScore,
  modeLabel,
  score,
  lastScoreLabel,
}: {
  bestScore: number;
  modeLabel: string;
  score: number;
  lastScoreLabel: string;
}) {
  return (
    <div className="snake-run-summary" aria-label="Current Snake run">
      <div>
        <span>Score</span>
        <strong>
          <AnimatedNumber value={score} />
        </strong>
      </div>
      <div className="snake-run-summary-meta">
        <span>{modeLabel}</span>
        <span>Best {bestScore}</span>
        {lastScoreLabel !== "0" ? (
          <m.span
            className="last-bite-pop"
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {lastScoreLabel}
          </m.span>
        ) : null}
      </div>
    </div>
  );
}

function BestScoresPanel({ bestScores }: { bestScores: Record<SnakeMode, number> }) {
  const topScore = Math.max(...Object.values(bestScores));

  return (
    <section className="snake-best-panel" aria-label="Mode best scores">
      {topScore > 0 ? (
        <div className="snake-best-list">
          {snakeModes.map((mode) => (
            <span key={mode}>
              {snakeModeDefinitions[mode].label}
              <strong>
                <AnimatedNumber value={bestScores[mode] ?? 0} />
              </strong>
            </span>
          ))}
        </div>
      ) : (
        <span>No best yet. Start a run.</span>
      )}
    </section>
  );
}

function Metric({
  Icon,
  label,
  muted = false,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  muted?: boolean;
  value: string;
}) {
  const numericValue = parsePlainNumber(value);

  return (
    <div className={`metric ${muted ? "muted" : ""}`}>
      <span>
        <Icon aria-hidden="true" />
        {label}
      </span>
      <strong>{numericValue === null ? value : <AnimatedNumber value={numericValue} />}</strong>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, {
    stiffness: 260,
    damping: 34,
    mass: 0.7,
  });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <m.span className="animated-number">{display}</m.span>;
}

function parsePlainNumber(value: string) {
  return /^\d+$/u.test(value) ? Number(value) : null;
}

function getOverlayCopy(state: SnakeState) {
  if (state.status === "game-over") {
    if (state.lastEvent === "time-up") {
      return {
        kicker: "Time",
        title: "Clock ran out.",
        body: "One more sprint. Press Space or R to restart.",
      };
    }

    if (state.lastEvent === "cleared") {
      return {
        kicker: "Cleared",
        title: "Board cleared.",
        body: "Clean route. Run it back when ready.",
      };
    }

    if (state.lastEvent === "hit-self") {
      return {
        kicker: "Crashed",
        title: "Ran into yourself.",
        body: "The route got tight. Press Space or R to restart.",
      };
    }

    return {
      kicker: "Crashed",
      title: "Hit the wall.",
      body: "Too close. Press Space or R to run it back.",
    };
  }

  if (state.status === "paused") {
    return {
      kicker: "Paused",
      title: "Paused",
      body: "Take a breath. Space resumes the run.",
    };
  }

  return {
    kicker: "Ready",
    title: `${snakeModeDefinitions[state.mode].label} Snake`,
    body: "Eat apples. Stay alive. Beat your best.",
  };
}

function shouldIgnoreShortcut(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("[role='tab'], a, input, select, textarea, [contenteditable='true']"),
  );
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
  const activeGlow = state.status === "playing" ? 0.04 + Math.sin(timestamp / 420) * 0.018 : 0;
  boardGlow.addColorStop(0, `rgba(131, 228, 111, ${0.12 + activeGlow})`);
  boardGlow.addColorStop(1, "rgba(131, 228, 111, 0)");
  context.fillStyle = boardGlow;
  context.fillRect(0, 0, width, height);

  const padding = Math.max(9 * dpr, Math.min(width, height) * 0.036);
  const boardPixels = Math.max(1, Math.min(width - padding * 2, height - padding * 2));
  const cellSize = boardPixels / state.boardSize;
  const originX = (width - boardPixels) / 2;
  const originY = (height - boardPixels) / 2;

  drawGrid(context, state.boardSize, originX, originY, boardPixels, cellSize, dpr);
  drawBoardFrame(context, originX, originY, boardPixels, dpr, timestamp, state.status);
  if (state.status !== "ready") {
    drawFood(context, state, originX, originY, cellSize, dpr, timestamp);
  }
  drawSnake(context, state, progress, originX, originY, cellSize, dpr, timestamp);

  if (state.status === "game-over") {
    context.fillStyle = "rgba(5, 10, 17, 0.38)";
    context.fillRect(0, 0, width, height);
    drawCrashMarker(context, state, originX, originY, cellSize, dpr, timestamp);
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
  context.strokeStyle = "rgba(255, 255, 255, 0.032)";
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

  context.strokeStyle = "rgba(255, 255, 255, 0.13)";
  context.lineWidth = 1.25 * dpr;
  roundedRect(context, originX, originY, boardPixels, boardPixels, 14 * dpr);
  context.stroke();
  context.restore();
}

function drawBoardFrame(
  context: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  boardPixels: number,
  dpr: number,
  timestamp: number,
  status: SnakeState["status"],
) {
  const activePulse = status === "playing" ? 0.28 + Math.sin(timestamp / 480) * 0.08 : 0.16;

  context.save();
  context.lineWidth = 2 * dpr;
  context.strokeStyle = `rgba(131, 228, 111, ${activePulse})`;
  roundedRect(
    context,
    originX + 1.5 * dpr,
    originY + 1.5 * dpr,
    boardPixels - 3 * dpr,
    boardPixels - 3 * dpr,
    12 * dpr,
  );
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.06)";
  context.lineWidth = 1 * dpr;
  roundedRect(
    context,
    originX + 8 * dpr,
    originY + 8 * dpr,
    boardPixels - 16 * dpr,
    boardPixels - 16 * dpr,
    9 * dpr,
  );
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.045)";
  for (let index = 0; index < 18; index += 1) {
    const orbit = (index * 97 + timestamp * 0.018) % boardPixels;
    const x = originX + ((index * 53 + orbit) % boardPixels);
    const y = originY + ((index * 31 + orbit * 0.58) % boardPixels);
    context.beginPath();
    context.arc(x, y, Math.max(0.7 * dpr, boardPixels * 0.0018), 0, Math.PI * 2);
    context.fill();
  }

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

  const pulse = 1 + Math.sin(timestamp / 170) * 0.07;
  const bob = Math.sin(timestamp / 240) * cellSize * 0.035;
  const foodSize = cellSize * 0.62 * pulse;
  const foodX = originX + state.food.x * cellSize + (cellSize - foodSize) / 2;
  const foodY = originY + state.food.y * cellSize + (cellSize - foodSize) / 2 + bob;
  const centerX = foodX + foodSize / 2;
  const centerY = foodY + foodSize / 2;

  context.save();
  context.shadowColor = "rgba(255, 100, 88, 0.48)";
  context.shadowBlur = 18 * dpr;
  context.fillStyle = "rgba(255, 100, 88, 0.16)";
  context.beginPath();
  context.arc(centerX, centerY, foodSize * 1.05, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 10 * dpr;
  const appleGradient = context.createRadialGradient(
    centerX - foodSize * 0.18,
    centerY - foodSize * 0.2,
    foodSize * 0.08,
    centerX,
    centerY,
    foodSize * 0.58,
  );
  appleGradient.addColorStop(0, "#ff9a8d");
  appleGradient.addColorStop(0.56, "#ff5f55");
  appleGradient.addColorStop(1, "#cd3f3c");
  context.fillStyle = appleGradient;
  context.beginPath();
  context.moveTo(centerX, centerY - foodSize * 0.46);
  context.bezierCurveTo(
    centerX - foodSize * 0.52,
    centerY - foodSize * 0.42,
    centerX - foodSize * 0.58,
    centerY + foodSize * 0.08,
    centerX - foodSize * 0.28,
    centerY + foodSize * 0.42,
  );
  context.bezierCurveTo(
    centerX - foodSize * 0.08,
    centerY + foodSize * 0.6,
    centerX + foodSize * 0.08,
    centerY + foodSize * 0.6,
    centerX + foodSize * 0.28,
    centerY + foodSize * 0.42,
  );
  context.bezierCurveTo(
    centerX + foodSize * 0.58,
    centerY + foodSize * 0.08,
    centerX + foodSize * 0.52,
    centerY - foodSize * 0.42,
    centerX,
    centerY - foodSize * 0.46,
  );
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 255, 255, 0.28)";
  context.lineWidth = 1 * dpr;
  context.stroke();
  context.strokeStyle = "rgba(75, 49, 28, 0.8)";
  context.lineWidth = 2 * dpr;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(centerX, foodY + foodSize * 0.2);
  context.lineTo(centerX + foodSize * 0.08, foodY + foodSize * 0.02);
  context.stroke();
  context.fillStyle = "#83e46f";
  context.beginPath();
  context.ellipse(
    centerX + foodSize * 0.22,
    foodY + foodSize * 0.12,
    foodSize * 0.14,
    foodSize * 0.08,
    -0.5,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.fillStyle = "rgba(255, 255, 255, 0.74)";
  context.beginPath();
  context.ellipse(
    foodX + foodSize * 0.66,
    foodY + foodSize * 0.35,
    Math.max(1.5 * dpr, foodSize * 0.09),
    Math.max(1 * dpr, foodSize * 0.045),
    -0.55,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.fillStyle = "rgba(255, 210, 120, 0.65)";
  for (let index = 0; index < 3; index += 1) {
    const angle = timestamp / 420 + index * 2.1;
    context.beginPath();
    context.arc(
      centerX + Math.cos(angle) * foodSize * 0.78,
      centerY + Math.sin(angle) * foodSize * 0.78,
      Math.max(0.9 * dpr, foodSize * 0.035),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
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
  timestamp: number,
) {
  const drawPoints = state.snake.map((point, index) => {
    const previousPoint =
      state.previousSnake[index] ?? state.previousSnake[state.previousSnake.length - 1] ?? point;

    return state.status === "playing"
      ? interpolatePoint(previousPoint, point, progress, state.boardSize)
      : point;
  });

  drawSnakeTrail(context, drawPoints, originX, originY, cellSize, dpr);
  drawSnakeBodyPath(context, drawPoints, state.boardSize, originX, originY, cellSize, dpr);
  drawSnakeScales(context, drawPoints, originX, originY, cellSize, dpr, timestamp);
  drawSnakeHead(
    context,
    drawPoints[0],
    state.direction,
    originX,
    originY,
    cellSize,
    dpr,
    timestamp,
  );

  if (state.lastEvent === "ate") {
    drawBiteBurst(context, state, drawPoints[0], originX, originY, cellSize, dpr, timestamp);
  }
}

function drawSnakeTrail(
  context: CanvasRenderingContext2D,
  drawPoints: Point[],
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
) {
  const head = drawPoints[0];

  if (!head) {
    return;
  }

  const center = getCellCenter(head, originX, originY, cellSize);

  context.save();
  context.fillStyle = "rgba(131, 228, 111, 0.07)";
  context.shadowColor = "rgba(131, 228, 111, 0.2)";
  context.shadowBlur = 14 * dpr;
  context.beginPath();
  context.arc(center.x, center.y, cellSize * 1.08, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSnakeBodyPath(
  context: CanvasRenderingContext2D,
  drawPoints: Point[],
  boardSize: number,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
) {
  if (drawPoints.length <= 1) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = cellSize * 0.68;
  context.shadowColor = "rgba(105, 218, 98, 0.32)";
  context.shadowBlur = 14 * dpr;
  context.strokeStyle = "#55b862";

  const points = [...drawPoints].reverse();
  let drawing = false;
  let previousPoint = points[0];

  context.beginPath();

  points.forEach((point, index) => {
    const center = getCellCenter(point, originX, originY, cellSize);

    if (index === 0 || !isContinuousSnakePoint(previousPoint, point, boardSize)) {
      if (drawing) {
        context.stroke();
        context.beginPath();
      }

      context.moveTo(center.x, center.y);
      drawing = true;
    } else {
      context.lineTo(center.x, center.y);
    }

    previousPoint = point;
  });

  if (drawing) {
    context.stroke();
  }

  context.shadowBlur = 0;
  context.lineWidth = cellSize * 0.44;
  context.strokeStyle = "#8eeb78";
  context.stroke();
  context.lineWidth = cellSize * 0.16;
  context.strokeStyle = "rgba(239, 255, 218, 0.42)";
  context.stroke();
  context.restore();
}

function drawSnakeScales(
  context: CanvasRenderingContext2D,
  drawPoints: Point[],
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
  timestamp: number,
) {
  const maxScaleDots = Math.min(drawPoints.length, 56);

  context.save();
  context.fillStyle = "rgba(229, 255, 200, 0.22)";
  for (let index = 1; index < maxScaleDots; index += 2) {
    const point = drawPoints[index];
    const center = getCellCenter(point, originX, originY, cellSize);
    const shimmer = 0.78 + Math.sin(timestamp / 260 + index * 0.62) * 0.18;

    context.beginPath();
    context.ellipse(
      center.x,
      center.y,
      Math.max(1.2 * dpr, cellSize * 0.08 * shimmer),
      Math.max(0.8 * dpr, cellSize * 0.045),
      (index % 4) * 0.5,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function drawSnakeHead(
  context: CanvasRenderingContext2D,
  point: Point | undefined,
  direction: Direction,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
  timestamp: number,
) {
  if (!point) {
    return;
  }

  const center = getCellCenter(point, originX, originY, cellSize);
  const size = cellSize * 0.78;
  const x = center.x - size / 2;
  const y = center.y - size / 2;
  const radius = size * 0.38;

  context.save();
  context.shadowColor = "rgba(155, 234, 130, 0.38)";
  context.shadowBlur = 15 * dpr;
  const headGradient = context.createLinearGradient(x, y, x + size, y + size);
  headGradient.addColorStop(0, "#b7fb96");
  headGradient.addColorStop(0.58, "#8ee878");
  headGradient.addColorStop(1, "#58bd5d");
  context.fillStyle = headGradient;
  roundedRect(context, x, y, size, size, radius);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 255, 255, 0.18)";
  context.lineWidth = 1 * dpr;
  roundedRect(context, x + 0.5 * dpr, y + 0.5 * dpr, size - 1 * dpr, size - 1 * dpr, radius);
  context.stroke();
  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  roundedRect(context, x + size * 0.12, y + size * 0.1, size * 0.38, size * 0.2, size * 0.1);
  context.fill();
  drawSnakeTongue(context, x, y, size, dpr, direction, timestamp);
  drawSnakeEyes(context, x, y, size, dpr, direction);
  context.restore();
}

function drawBiteBurst(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  point: Point | undefined,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
  timestamp: number,
) {
  if (!point || state.lastScoreDelta <= 0) {
    return;
  }

  const center = getCellCenter(point, originX, originY, cellSize);
  const ringProgress = (timestamp % 460) / 460;

  context.save();
  context.strokeStyle = `rgba(255, 111, 99, ${0.55 * (1 - ringProgress)})`;
  context.lineWidth = (1.4 + ringProgress * 1.2) * dpr;
  context.beginPath();
  context.arc(center.x, center.y, cellSize * (0.52 + ringProgress * 0.42), 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "rgba(255, 245, 237, 0.94)";
  context.font = `700 ${Math.max(10 * dpr, cellSize * 0.3)}px ui-sans-serif, system-ui, sans-serif`;
  context.fillText(
    `+${state.lastScoreDelta}`,
    center.x + cellSize * 0.32,
    center.y - cellSize * 0.34,
  );
  context.restore();
}

function drawCrashMarker(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  originX: number,
  originY: number,
  cellSize: number,
  dpr: number,
  timestamp: number,
) {
  const head = state.snake[0];

  if (!head) {
    return;
  }

  const pulse = 1 + Math.sin(timestamp / 150) * 0.04;
  const center = getCellCenter(head, originX, originY, cellSize);

  context.save();
  context.shadowColor = "rgba(255, 111, 99, 0.62)";
  context.shadowBlur = 18 * dpr;
  context.strokeStyle = "rgba(255, 111, 99, 0.88)";
  context.lineWidth = 2 * dpr;
  context.beginPath();
  context.arc(center.x, center.y, cellSize * 0.55 * pulse, 0, Math.PI * 2);
  context.stroke();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 232, 226, 0.74)";
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(center.x - cellSize * 0.18, center.y - cellSize * 0.18);
  context.lineTo(center.x + cellSize * 0.18, center.y + cellSize * 0.18);
  context.moveTo(center.x + cellSize * 0.18, center.y - cellSize * 0.18);
  context.lineTo(center.x - cellSize * 0.18, center.y + cellSize * 0.18);
  context.stroke();
  context.fillStyle = "rgba(255, 210, 120, 0.8)";
  for (let index = 0; index < 7; index += 1) {
    const angle = index * 0.9 + timestamp / 180;
    const distance = cellSize * (0.54 + (index % 3) * 0.11);

    context.beginPath();
    context.arc(
      center.x + Math.cos(angle) * distance,
      center.y + Math.sin(angle) * distance,
      Math.max(0.9 * dpr, cellSize * 0.035),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function getCellCenter(point: Point, originX: number, originY: number, cellSize: number) {
  return {
    x: originX + point.x * cellSize + cellSize / 2,
    y: originY + point.y * cellSize + cellSize / 2,
  };
}

function isContinuousSnakePoint(previousPoint: Point, point: Point, boardSize: number) {
  const deltaX = Math.abs(previousPoint.x - point.x);
  const deltaY = Math.abs(previousPoint.y - point.y);

  return deltaX <= 1.1 && deltaY <= 1.1 && deltaX < boardSize / 2 && deltaY < boardSize / 2;
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

function drawSnakeTongue(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dpr: number,
  direction: Direction,
  timestamp: number,
) {
  const flick = 0.76 + Math.sin(timestamp / 120) * 0.16;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const length = size * 0.24 * flick;
  const fork = size * 0.07;
  const vector: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  };
  const normal: Record<Direction, Point> = {
    up: { x: 1, y: 0 },
    right: { x: 0, y: 1 },
    down: { x: 1, y: 0 },
    left: { x: 0, y: 1 },
  };
  const nose = {
    x: centerX + vector[direction].x * size * 0.42,
    y: centerY + vector[direction].y * size * 0.42,
  };
  const tip = {
    x: nose.x + vector[direction].x * length,
    y: nose.y + vector[direction].y * length,
  };

  context.save();
  context.strokeStyle = "rgba(255, 118, 131, 0.88)";
  context.lineWidth = Math.max(1 * dpr, size * 0.035);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(nose.x, nose.y);
  context.lineTo(tip.x, tip.y);
  context.lineTo(tip.x + normal[direction].x * fork, tip.y + normal[direction].y * fork);
  context.moveTo(tip.x, tip.y);
  context.lineTo(tip.x - normal[direction].x * fork, tip.y - normal[direction].y * fork);
  context.stroke();
  context.restore();
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
